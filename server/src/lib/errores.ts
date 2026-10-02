import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class ErrorHttp extends Error {
  constructor(
    public status: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export const noEncontrado = (que: string) => new ErrorHttp(404, `${que} no encontrado.`);

/** Convierte un error de Supabase en un error HTTP con mensaje en castellano. */
export function siFalla(error: { message: string } | null, contexto: string) {
  if (error) throw new ErrorHttp(400, `${contexto}: ${error.message}`);
}

export const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const primero = err.issues[0];
    res.status(400).json({ error: primero?.message ?? "Datos inválidos." });
    return;
  }
  if (err instanceof ErrorHttp) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Ocurrió un error inesperado en el servidor." });
};
