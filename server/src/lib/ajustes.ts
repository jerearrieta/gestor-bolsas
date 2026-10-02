import type { SupabaseClient } from "@supabase/supabase-js";
import { siFalla } from "./errores.js";

export type Ajustes = {
  user_id: string;
  nombre_negocio: string;
  precio_metro_lienzo: number;
  margen_objetivo: number;
  prefijo_whatsapp: string;
  mensaje_listo: string;
};

/** Ajustes del negocio; la primera vez los crea con valores por defecto. */
export async function obtenerAjustes(supabase: SupabaseClient): Promise<Ajustes> {
  const { data } = await supabase.from("ajustes").select("*").maybeSingle();
  if (data) return normalizar(data);
  // "do nothing" si otra petición ya los creó al mismo tiempo
  const { error } = await supabase.from("ajustes").upsert({}, { onConflict: "user_id", ignoreDuplicates: true });
  siFalla(error, "No se pudieron crear los ajustes");
  const { data: creado, error: e2 } = await supabase.from("ajustes").select("*").single();
  siFalla(e2, "No se pudieron leer los ajustes");
  return normalizar(creado);
}

function normalizar(fila: Record<string, unknown>): Ajustes {
  return {
    ...(fila as Ajustes),
    precio_metro_lienzo: Number(fila.precio_metro_lienzo),
    margen_objetivo: Number(fila.margen_objetivo),
  };
}
