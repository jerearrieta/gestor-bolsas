"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { leerNumero, leerTexto } from "@/lib/format";
import type { EstadoFormulario } from "@/lib/tipos";

function refrescar() {
  revalidatePath("/catalogo");
  revalidatePath("/catalogo/calculadora");
}

export async function guardarProducto(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requireUser();
  const id = leerTexto(formData.get("id"));
  const datos = {
    nombre: leerTexto(formData.get("nombre")),
    descripcion: leerTexto(formData.get("descripcion")),
    precio: leerNumero(formData.get("precio")),
    metros_lienzo: leerNumero(formData.get("metros_lienzo")),
    otros_costos: leerNumero(formData.get("otros_costos")),
    activo: formData.get("activo") === "on",
  };
  if (!datos.nombre) return { error: "El nombre es obligatorio." };
  if (datos.precio < 0 || datos.metros_lienzo < 0 || datos.otros_costos < 0) {
    return { error: "Los valores no pueden ser negativos." };
  }

  const { error } = id
    ? await supabase.from("productos").update(datos).eq("id", id)
    : await supabase.from("productos").insert(datos);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  refrescar();
  redirect("/catalogo");
}

/** Cambio rápido de precio desde la lista del catálogo o la calculadora. */
export async function actualizarPrecio(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const precio = leerNumero(formData.get("precio"), -1);
  if (precio < 0) return;
  const { error } = await supabase.from("productos").update({ precio }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar el precio: ${error.message}`);
  refrescar();
}

export async function aumentarPrecios(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requireUser();
  const porcentaje = leerNumero(formData.get("porcentaje"), NaN);
  const redondeo = leerNumero(formData.get("redondeo"), 0);
  if (!Number.isFinite(porcentaje) || porcentaje === 0) return { error: "Ingresá un porcentaje distinto de 0." };
  if (porcentaje <= -100) return { error: "El porcentaje no puede ser -100% o menos." };

  const { data, error } = await supabase.rpc("aumentar_precios", { porcentaje, redondeo });
  if (error) return { error: `No se pudieron actualizar los precios: ${error.message}` };
  refrescar();
  const signo = porcentaje > 0 ? "+" : "";
  return { ok: `Listo: ${data} productos actualizados (${signo}${porcentaje}%).` };
}

export async function borrarProducto(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar el producto: ${error.message}`);
  refrescar();
  redirect("/catalogo");
}

export async function guardarCostosBase(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, user } = await requireUser();
  const precio_metro_lienzo = leerNumero(formData.get("precio_metro_lienzo"), -1);
  const margen_objetivo = leerNumero(formData.get("margen_objetivo"), -1);
  if (precio_metro_lienzo < 0) return { error: "Ingresá cuánto te cuesta el metro de lienzo." };
  if (margen_objetivo < 0 || margen_objetivo >= 95) return { error: "El margen tiene que estar entre 0% y 95%." };
  const { error } = await supabase
    .from("ajustes")
    .upsert({ user_id: user.id, precio_metro_lienzo, margen_objetivo });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  refrescar();
  return { ok: "Guardado. Los precios sugeridos se recalcularon." };
}
