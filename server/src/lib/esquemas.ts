import { z } from "zod";

/** Acepta 1500, "1500", "1.500,50" o "1500.50". Vacío = 0. */
export const monto = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  let t = String(v).trim().replace(/\s|\$/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  return Number(t);
}, z.number({ error: "Número inválido." }).finite({ error: "Número inválido." }).min(0, { error: "Los valores no pueden ser negativos." }));

/** Texto opcional: "" -> null */
export const texto = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() || null : (v ?? null)),
  z.string().max(2000).nullable(),
);

export const fecha = z.preprocess(
  (v) => (v === "" ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida." }).nullable(),
);

export const ESTADOS = ["pendiente", "en_produccion", "listo", "entregado", "cancelado"] as const;
export const estadoPedido = z.enum(ESTADOS, { error: "Estado inválido." });
