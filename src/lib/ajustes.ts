import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ajustes } from "./tipos";

/** Devuelve los ajustes del negocio; si es la primera vez, los crea con valores por defecto. */
export const obtenerAjustes = cache(async (supabase: SupabaseClient): Promise<Ajustes> => {
  const { data } = await supabase.from("ajustes").select("*").maybeSingle();
  if (data) return normalizar(data);

  // "do nothing" si otra carga de la página ya los creó al mismo tiempo
  const { error } = await supabase.from("ajustes").upsert({}, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) throw new Error(`No se pudieron crear los ajustes: ${error.message}`);
  const { data: creado, error: errorLectura } = await supabase.from("ajustes").select("*").single();
  if (errorLectura) throw new Error(`No se pudieron leer los ajustes: ${errorLectura.message}`);
  return normalizar(creado);
});

function normalizar(fila: Record<string, unknown>): Ajustes {
  return {
    ...(fila as Ajustes),
    precio_metro_lienzo: Number(fila.precio_metro_lienzo),
    margen_objetivo: Number(fila.margen_objetivo),
  };
}
