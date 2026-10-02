import { Router } from "express";
import { z } from "zod";
import { sesion } from "../supabase.js";
import { obtenerAjustes } from "../lib/ajustes.js";
import { ErrorHttp, noEncontrado, siFalla } from "../lib/errores.js";
import { estadoPedido, fecha, monto, texto } from "../lib/esquemas.js";
import { hoyISO } from "../lib/formato.js";
import { avisoPedidoListo } from "../lib/mensajes.js";

export const pedidos = Router();

const ACTIVOS = ["pendiente", "en_produccion", "listo"] as const;

pedidos.get("/", async (req, res) => {
  const { supabase } = sesion(res);
  const filtro = typeof req.query.estado === "string" ? req.query.estado : "activos";
  let consulta = supabase.from("pedidos_resumen").select("*");
  if (filtro === "activos") consulta = consulta.in("estado", [...ACTIVOS]);
  else if (filtro !== "todos") consulta = consulta.eq("estado", estadoPedido.parse(filtro));
  consulta =
    filtro === "activos"
      ? consulta.order("fecha_entrega", { ascending: true, nullsFirst: false }).order("numero")
      : consulta.order("numero", { ascending: false });

  const [{ data, error }, { data: todos }] = await Promise.all([consulta.limit(300), supabase.from("pedidos").select("estado")]);
  siFalla(error, "No se pudieron leer los pedidos");
  const conteos: Record<string, number> = { activos: 0, todos: todos?.length ?? 0 };
  for (const p of todos ?? []) {
    conteos[p.estado] = (conteos[p.estado] ?? 0) + 1;
    if ((ACTIVOS as readonly string[]).includes(p.estado)) conteos.activos += 1;
  }
  res.json({ pedidos: data ?? [], conteos, hoy: hoyISO() });
});

/** Clientes y productos activos para armar el formulario de pedido. */
pedidos.get("/opciones", async (_req, res) => {
  const { supabase } = sesion(res);
  const [{ data: clientes }, { data: productos }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, telefono, direccion, localidad").order("nombre"),
    supabase.from("productos").select("id, nombre, precio").eq("activo", true).order("nombre"),
  ]);
  res.json({
    clientes: clientes ?? [],
    productos: (productos ?? []).map((p) => ({ ...p, precio: Number(p.precio) })),
    hoy: hoyISO(),
  });
});

pedidos.get("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const id = req.params.id;
  const [{ data: pedido }, { data: items }, { data: pagos }, ajustes] = await Promise.all([
    supabase.from("pedidos_resumen").select("*").eq("id", id).maybeSingle(),
    supabase.from("pedido_items").select("*").eq("pedido_id", id).order("posicion"),
    supabase.from("movimientos").select("*").eq("pedido_id", id).order("fecha"),
    obtenerAjustes(supabase),
  ]);
  if (!pedido) throw noEncontrado("Pedido");
  res.json({ pedido, items: items ?? [], pagos: pagos ?? [], whatsapp_listo: avisoPedidoListo(pedido, ajustes), hoy: hoyISO() });
});

const esquemaPedido = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  nuevo_cliente: z
    .object({
      nombre: z.string().trim().min(1, { error: "Escribí el nombre del cliente nuevo." }),
      telefono: texto.optional(),
    })
    .nullable()
    .optional(),
  estado: estadoPedido.default("pendiente"),
  fecha: fecha.optional(),
  fecha_entrega: fecha.optional(),
  direccion_envio: texto.optional(),
  costo_envio: monto.default(0),
  descuento: monto.default(0),
  notas: texto.optional(),
  sena: monto.default(0),
  items: z
    .array(
      z.object({
        producto_id: z.string().uuid().nullable().optional(),
        descripcion: z.string().trim().min(1, { error: "Cada producto necesita una descripción." }),
        cantidad: z.coerce.number().int({ error: "La cantidad tiene que ser un número entero." }).positive({ error: "La cantidad tiene que ser mayor a 0." }),
        precio_unitario: monto,
      }),
    )
    .min(1, { error: "Agregá al menos un producto al pedido." }),
});

async function guardar(res: Parameters<typeof sesion>[0], cuerpo: unknown, id?: string) {
  const { supabase } = sesion(res);
  const { nuevo_cliente, items, sena, ...resto } = esquemaPedido.parse(cuerpo);

  let clienteId = resto.cliente_id ?? null;
  if (nuevo_cliente) {
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nombre: nuevo_cliente.nombre, telefono: nuevo_cliente.telefono ?? null, direccion: resto.direccion_envio ?? null })
      .select("id")
      .single();
    siFalla(error, "No se pudo crear el cliente");
    clienteId = data!.id;
  }

  const datos = {
    cliente_id: clienteId,
    estado: resto.estado,
    fecha: resto.fecha ?? hoyISO(),
    fecha_entrega: resto.fecha_entrega ?? null,
    direccion_envio: resto.direccion_envio ?? null,
    costo_envio: resto.costo_envio,
    descuento: resto.descuento,
    notas: resto.notas ?? null,
  };

  let pedidoId = id;
  if (id) {
    const { data, error } = await supabase.from("pedidos").update(datos).eq("id", id).select("id");
    siFalla(error, "No se pudo guardar el pedido");
    if (!data?.length) throw noEncontrado("Pedido");
    const { error: e2 } = await supabase.from("pedido_items").delete().eq("pedido_id", id);
    siFalla(e2, "No se pudieron actualizar los productos");
  } else {
    const { data, error } = await supabase.from("pedidos").insert(datos).select("id").single();
    siFalla(error, "No se pudo crear el pedido");
    pedidoId = data!.id;
  }

  const { error: errorItems } = await supabase
    .from("pedido_items")
    .insert(items.map((i, posicion) => ({ ...i, producto_id: i.producto_id ?? null, posicion, pedido_id: pedidoId })));
  if (errorItems) {
    if (!id) await supabase.from("pedidos").delete().eq("id", pedidoId);
    throw new ErrorHttp(400, `No se pudieron guardar los productos: ${errorItems.message}`);
  }

  // Seña cobrada al crear el pedido -> ingreso en finanzas
  if (!id && sena > 0) {
    const { error } = await supabase.from("movimientos").insert({
      tipo: "ingreso",
      monto: sena,
      categoria: "Seña",
      descripcion: "Seña del pedido",
      fecha: datos.fecha,
      pedido_id: pedidoId,
    });
    siFalla(error, "El pedido se creó pero no se pudo registrar la seña");
  }
  return pedidoId!;
}

pedidos.post("/", async (req, res) => {
  res.status(201).json({ id: await guardar(res, req.body) });
});

pedidos.put("/:id", async (req, res) => {
  res.json({ id: await guardar(res, req.body, req.params.id) });
});

pedidos.patch("/:id/estado", async (req, res) => {
  const { supabase } = sesion(res);
  const { estado } = z.object({ estado: estadoPedido }).parse(req.body);
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", req.params.id);
  siFalla(error, "No se pudo cambiar el estado");
  res.json({ id: req.params.id, estado });
});

pedidos.post("/:id/pagos", async (req, res) => {
  const { supabase } = sesion(res);
  const datos = z
    .object({
      monto: monto.refine((v) => v > 0, { error: "Ingresá un monto mayor a 0." }),
      fecha: fecha.optional(),
      categoria: z.enum(["Venta", "Seña"]).default("Venta"),
      descripcion: texto.optional(),
    })
    .parse(req.body);
  const { error } = await supabase.from("movimientos").insert({
    tipo: "ingreso",
    monto: datos.monto,
    categoria: datos.categoria,
    descripcion: datos.descripcion ?? "Pago del pedido",
    fecha: datos.fecha ?? hoyISO(),
    pedido_id: req.params.id,
  });
  siFalla(error, "No se pudo registrar el pago");
  res.status(201).json({ ok: true });
});

pedidos.delete("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  // Los pagos asociados quedan en finanzas (sin pedido) para no perder el registro del dinero.
  const { error } = await supabase.from("pedidos").delete().eq("id", req.params.id);
  siFalla(error, "No se pudo borrar el pedido");
  res.status(204).end();
});
