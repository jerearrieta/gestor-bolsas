import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { RequestHandler, Response } from "express";
import { ErrorHttp } from "./lib/errores.js";

function entorno() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL y SUPABASE_ANON_KEY (ver server/.env.example).");
  return { url, key };
}

export type Sesion = { supabase: SupabaseClient; usuario: User };

/**
 * Valida el token que manda el front (Authorization: Bearer ...) y crea un cliente de Supabase
 * que actúa como ese usuario, así las políticas RLS filtran sus datos.
 */
export const requiereUsuario: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ErrorHttp(401, "Tenés que iniciar sesión.");
  const { url, key } = entorno();
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new ErrorHttp(401, "La sesión venció. Volvé a iniciar sesión.");
  res.locals.sesion = { supabase, usuario: data.user } satisfies Sesion;
  next();
};

export function sesion(res: Response): Sesion {
  return res.locals.sesion as Sesion;
}
