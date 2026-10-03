import { Router } from "express";
import { z } from "zod";
import { sesion } from "../supabase.js";
import { obtenerAjustes, type Ajustes } from "../lib/ajustes.js";
import { noEncontrado, siFalla } from "../lib/errores.js";
import { monto, texto } from "../lib/esquemas.js";
import { costoBolsa, margenReal, precioSugerido, redondearPrecio } from "../lib/precios.js";

export const productos = Router();

const CAMPOS = "id, nombre, descripcion, activo, medidas:producto_medidas(id, medida, precio, metros_lienzo, otros_costos, posicion)";

type Medida = { id: string; medida: string; precio: number; metros_lienzo: number; otros_costos: number; posicion: number };
type Producto = { id: string; nombre: string; descripcion: string | null; activo: boolean; medidas: Medida[] };

/** Agrega a cada medida su costo, el precio sugerido y el margen real según los ajustes. */
function conCalculos(p: Producto, a: Ajustes) {
  const medidas = [...(p.medidas ?? [])]
    .sort((x, y) => x.posicion - y.posicion)
    .map((m) => {
      const precio = Number(m.precio);
      const costo = costoBolsa(a.precio_metro_lienzo, Number(m.metros_lienzo), Number(m.otros_costos));
      const margen = margenReal(precio, costo);
      return {
        id: m.id,
        medida: m.medida,
        precio,
        metros_lienzo: Number(m.metros_lienzo),
        otros_costos: Number(m.otros_costos),
        costo,
        precio_sugerido: redondearPrecio(precioSugerido(costo, a.margen_objetivo)),
        margen_real: margen,
        margen_bajo: costo > 0 && margen < a.margen_objetivo,
      };
    });
  return { ...p, medidas };
}

productos.get("/", async (req, res) => {
  const { supabase } = sesion(res);
  let consulta = supabase.from("productos").select(CAMPOS).order("activo", { ascending: false }).order("nombre");
  if (req.query.activos === "1") consulta = consulta.eq("activo", true);
  const [{ data, error }, ajustes] = await Promise.all([consulta, obtenerAjustes(supabase)]);
  siFalla(error, "No se pudieron leer los productos");
  res.json({
    productos: ((data ?? []) as Producto[]).map((p) => conCalculos(p, ajustes)),
    precio_metro_lienzo: ajustes.precio_metro_lienzo,
    margen_objetivo: ajustes.margen_objetivo,
  });
});

productos.get("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const [{ data }, ajustes] = await Promise.all([
    supabase.from("productos").select(CAMPOS).eq("id", req.params.id).maybeSingle(),
    obtenerAjustes(supabase),
  ]);
  if (!data) throw noEncontrado("Producto");
  res.json(conCalculos(data as Producto, ajustes));
});

const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, { error: "El nombre es obligatorio." }),
  descripcion: texto.optional(),
  activo: z.boolean().default(true),
  medidas: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        medida: z.string().trim().max(100).default(""),
        precio: monto,
        metros_lienzo: monto.default(0),
        otros_costos: monto.default(0),
      }),
    )
    .min(1, { error: "Agregá al menos una medida con su precio." }),
});

/** Guarda las medidas del producto: actualiza las que siguen, crea las nuevas y borra las que se quitaron. */
async function guardarMedidas(res: Parameters<typeof sesion>[0], productoId: string, medidas: z.infer<typeof esquemaProducto>["medidas"]) {
  const { supabase } = sesion(res);
  const { data: actuales, error } = await supabase.from("producto_medidas").select("id").eq("producto_id", productoId);
  siFalla(error, "No se pudieron leer las medidas");
  const quedan = new Set(medidas.map((m) => m.id).filter(Boolean));
  const borrar = (actuales ?? []).map((m) => m.id).filter((id) => !quedan.has(id));
  if (borrar.length) {
    const { error: e } = await supabase.from("producto_medidas").delete().in("id", borrar);
    siFalla(e, "No se pudieron quitar las medidas");
  }
  const filas = medidas.map(({ id, ...m }, posicion) => ({ ...m, posicion, producto_id: productoId, ...(id ? { id } : {}) }));
  const existentes = filas.filter((f) => "id" in f);
  const nuevas = filas.filter((f) => !("id" in f));
  if (existentes.length) {
    const { error: e } = await supabase.from("producto_medidas").upsert(existentes);
    siFalla(e, "No se pudieron guardar las medidas");
  }
  if (nuevas.length) {
    const { error: e } = await supabase.from("producto_medidas").insert(nuevas);
    siFalla(e, "No se pudieron guardar las medidas");
  }
}

productos.post("/", async (req, res) => {
  const { supabase } = sesion(res);
  const { medidas, ...producto } = esquemaProducto.parse(req.body);
  const { data, error } = await supabase.from("productos").insert(producto).select("id").single();
  siFalla(error, "No se pudo crear el producto");
  try {
    await guardarMedidas(res, data!.id, medidas);
  } catch (e) {
    await supabase.from("productos").delete().eq("id", data!.id);
    throw e;
  }
  res.status(201).json(data);
});

productos.put("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const { medidas, ...producto } = esquemaProducto.parse(req.body);
  const { data, error } = await supabase.from("productos").update(producto).eq("id", req.params.id).select("id");
  siFalla(error, "No se pudo guardar el producto");
  if (!data?.length) throw noEncontrado("Producto");
  await guardarMedidas(res, req.params.id, medidas);
  res.json({ id: req.params.id });
});

/** Cambio rápido del precio de una medida (catálogo y calculadora). */
productos.patch("/medidas/:id/precio", async (req, res) => {
  const { supabase } = sesion(res);
  const { precio } = z.object({ precio: monto }).parse(req.body);
  const { data, error } = await supabase.from("producto_medidas").update({ precio }).eq("id", req.params.id).select("id");
  siFalla(error, "No se pudo actualizar el precio");
  if (!data?.length) throw noEncontrado("Medida");
  res.json({ id: req.params.id, precio });
});

productos.delete("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const { error } = await supabase.from("productos").delete().eq("id", req.params.id);
  siFalla(error, "No se pudo borrar el producto");
  res.status(204).end();
});

/** Aumento (o baja) de todos los precios activos en un porcentaje, con redondeo. */
productos.post("/aumento", async (req, res) => {
  const { supabase } = sesion(res);
  const { porcentaje, redondeo } = z
    .object({
      porcentaje: z.coerce
        .number({ error: "Ingresá un porcentaje." })
        .refine((v) => v !== 0, { error: "Ingresá un porcentaje distinto de 0." })
        .refine((v) => v > -100, { error: "El porcentaje no puede ser -100% o menos." }),
      redondeo: z.coerce.number().min(0).default(0),
    })
    .parse(req.body);
  const { data, error } = await supabase.rpc("aumentar_precios", { porcentaje, redondeo });
  siFalla(error, "No se pudieron actualizar los precios");
  res.json({ actualizados: data as number });
});
