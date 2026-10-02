import { Router } from "express";
import { z } from "zod";
import { sesion } from "../supabase.js";
import { obtenerAjustes, type Ajustes } from "../lib/ajustes.js";
import { noEncontrado, siFalla } from "../lib/errores.js";
import { monto, texto } from "../lib/esquemas.js";
import { costoBolsa, margenReal, precioSugerido, redondearPrecio } from "../lib/precios.js";

export const productos = Router();

type Producto = { precio: number; metros_lienzo: number; otros_costos: number } & Record<string, unknown>;

/** Agrega al producto su costo, el precio sugerido y el margen real según los ajustes. */
function conCalculos(p: Producto, a: Ajustes) {
  const costo = costoBolsa(a.precio_metro_lienzo, Number(p.metros_lienzo), Number(p.otros_costos));
  const margen = margenReal(Number(p.precio), costo);
  return {
    ...p,
    precio: Number(p.precio),
    metros_lienzo: Number(p.metros_lienzo),
    otros_costos: Number(p.otros_costos),
    costo,
    precio_sugerido: redondearPrecio(precioSugerido(costo, a.margen_objetivo)),
    margen_real: margen,
    margen_bajo: costo > 0 && margen < a.margen_objetivo,
  };
}

productos.get("/", async (req, res) => {
  const { supabase } = sesion(res);
  let consulta = supabase.from("productos").select("*").order("activo", { ascending: false }).order("nombre");
  if (req.query.activos === "1") consulta = consulta.eq("activo", true);
  const [{ data, error }, ajustes] = await Promise.all([consulta, obtenerAjustes(supabase)]);
  siFalla(error, "No se pudieron leer los productos");
  res.json({
    productos: (data ?? []).map((p) => conCalculos(p, ajustes)),
    precio_metro_lienzo: ajustes.precio_metro_lienzo,
    margen_objetivo: ajustes.margen_objetivo,
  });
});

productos.get("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const [{ data }, ajustes] = await Promise.all([
    supabase.from("productos").select("*").eq("id", req.params.id).maybeSingle(),
    obtenerAjustes(supabase),
  ]);
  if (!data) throw noEncontrado("Producto");
  res.json(conCalculos(data, ajustes));
});

const esquemaProducto = z.object({
  nombre: z.string().trim().min(1, { error: "El nombre es obligatorio." }),
  descripcion: texto.optional(),
  precio: monto,
  metros_lienzo: monto,
  otros_costos: monto,
  activo: z.boolean().default(true),
});

productos.post("/", async (req, res) => {
  const { supabase } = sesion(res);
  const { data, error } = await supabase.from("productos").insert(esquemaProducto.parse(req.body)).select("id").single();
  siFalla(error, "No se pudo crear el producto");
  res.status(201).json(data);
});

productos.put("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const { error } = await supabase.from("productos").update(esquemaProducto.parse(req.body)).eq("id", req.params.id);
  siFalla(error, "No se pudo guardar el producto");
  res.json({ id: req.params.id });
});

/** Cambio rápido de precio (catálogo y calculadora). */
productos.patch("/:id/precio", async (req, res) => {
  const { supabase } = sesion(res);
  const { precio } = z.object({ precio: monto }).parse(req.body);
  const { error } = await supabase.from("productos").update({ precio }).eq("id", req.params.id);
  siFalla(error, "No se pudo actualizar el precio");
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
