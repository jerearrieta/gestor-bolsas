import { Router } from "express";
import { z } from "zod";
import { sesion } from "../supabase.js";
import { obtenerAjustes } from "../lib/ajustes.js";
import { siFalla } from "../lib/errores.js";
import { monto } from "../lib/esquemas.js";

export const ajustes = Router();

ajustes.get("/", async (_req, res) => {
  res.json(await obtenerAjustes(sesion(res).supabase));
});

const cambios = z
  .object({
    nombre_negocio: z.string().trim().min(1, { error: "El nombre del negocio es obligatorio." }),
    mensaje_listo: z.string().trim().min(1, { error: "El mensaje no puede quedar vacío." }),
    prefijo_whatsapp: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().min(1, { error: "Ingresá el código de país (para Argentina: 549)." })),
    precio_metro_lienzo: monto,
    margen_objetivo: monto.pipe(z.number().max(94.99, { error: "El margen tiene que estar entre 0% y 95%." })),
  })
  .partial();

ajustes.put("/", async (req, res) => {
  const { supabase, usuario } = sesion(res);
  const datos = cambios.parse(req.body);
  await obtenerAjustes(supabase);
  const { error } = await supabase.from("ajustes").update(datos).eq("user_id", usuario.id);
  siFalla(error, "No se pudieron guardar los ajustes");
  res.json(await obtenerAjustes(supabase));
});
