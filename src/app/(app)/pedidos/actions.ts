"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { hoyISO, leerNumero, leerTexto } from "@/lib/format";
import { ESTADOS, type EstadoFormulario, type EstadoPedido } from "@/lib/tipos";

type ItemFormulario = {
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

function leerItems(formData: FormData): ItemFormulario[] {
  try {
    const crudo = JSON.parse(String(formData.get("items") ?? "[]")) as ItemFormulario[];
    return crudo
      .map((i) => ({
        producto_id: i.producto_id || null,
        descripcion: String(i.descripcion ?? "").trim(),
        cantidad: Math.round(Number(i.cantidad)),
        precio_unitario: Number(i.precio_unitario),
      }))
      .filter((i) => i.descripcion && i.cantidad > 0 && Number.isFinite(i.precio_unitario) && i.precio_unitario >= 0);
  } catch {
    return [];
  }
}

function refrescar(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/pedidos/${id}`);
}

export async function guardarPedido(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requireUser();
  const id = leerTexto(formData.get("id"));
  const items = leerItems(formData);
  if (items.length === 0) return { error: "Agregá al menos un producto al pedido." };

  // Cliente: existente o nuevo cargado desde el mismo formulario
  let clienteId = leerTexto(formData.get("cliente_id"));
  if (clienteId === "nuevo") {
    const nombre = leerTexto(formData.get("nuevo_nombre"));
    if (!nombre) return { error: "Escribí el nombre del cliente nuevo." };
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre,
        telefono: leerTexto(formData.get("nuevo_telefono")),
        direccion: leerTexto(formData.get("direccion_envio")),
      })
      .select("id")
      .single();
    if (error) return { error: `No se pudo crear el cliente: ${error.message}` };
    clienteId = data.id;
  }

  const estado = (leerTexto(formData.get("estado")) ?? "pendiente") as EstadoPedido;
  if (!ESTADOS.some((e) => e.valor === estado)) return { error: "Estado inválido." };

  const datos = {
    cliente_id: clienteId,
    estado,
    fecha: leerTexto(formData.get("fecha")) ?? hoyISO(),
    fecha_entrega: leerTexto(formData.get("fecha_entrega")),
    direccion_envio: leerTexto(formData.get("direccion_envio")),
    costo_envio: Math.max(leerNumero(formData.get("costo_envio")), 0),
    descuento: Math.max(leerNumero(formData.get("descuento")), 0),
    notas: leerTexto(formData.get("notas")),
  };

  let pedidoId = id;
  if (id) {
    const { error } = await supabase.from("pedidos").update(datos).eq("id", id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
    const { error: errorBorrar } = await supabase.from("pedido_items").delete().eq("pedido_id", id);
    if (errorBorrar) return { error: `No se pudieron actualizar los productos: ${errorBorrar.message}` };
  } else {
    const { data, error } = await supabase.from("pedidos").insert(datos).select("id").single();
    if (error) return { error: `No se pudo crear el pedido: ${error.message}` };
    pedidoId = data.id;
  }

  const { error: errorItems } = await supabase
    .from("pedido_items")
    .insert(items.map((i, posicion) => ({ ...i, posicion, pedido_id: pedidoId })));
  if (errorItems) {
    if (!id) await supabase.from("pedidos").delete().eq("id", pedidoId);
    return { error: `No se pudieron guardar los productos: ${errorItems.message}` };
  }

  // Seña cobrada al crear el pedido -> ingreso en finanzas
  const sena = leerNumero(formData.get("sena"));
  if (!id && sena > 0) {
    await supabase.from("movimientos").insert({
      tipo: "ingreso",
      monto: sena,
      categoria: "Seña",
      descripcion: "Seña del pedido",
      fecha: datos.fecha,
      pedido_id: pedidoId,
    });
  }

  refrescar(pedidoId ?? undefined);
  redirect(`/pedidos/${pedidoId}`);
}

export async function cambiarEstado(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado")) as EstadoPedido;
  if (!ESTADOS.some((e) => e.valor === estado)) return;
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  refrescar(id);
}

export async function registrarPago(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const monto = leerNumero(formData.get("monto"));
  if (monto <= 0) return { error: "Ingresá un monto mayor a 0." };
  const { error } = await supabase.from("movimientos").insert({
    tipo: "ingreso",
    monto,
    categoria: leerTexto(formData.get("categoria")) ?? "Venta",
    descripcion: leerTexto(formData.get("descripcion")) ?? "Pago del pedido",
    fecha: leerTexto(formData.get("fecha")) ?? hoyISO(),
    pedido_id: id,
  });
  if (error) return { error: `No se pudo registrar el pago: ${error.message}` };
  refrescar(id);
  return { ok: "Pago registrado." };
}

export async function borrarPedido(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  // Los pagos asociados quedan en finanzas (sin pedido) para no perder el registro del dinero.
  const { error } = await supabase.from("pedidos").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar el pedido: ${error.message}`);
  refrescar();
  redirect("/pedidos");
}
