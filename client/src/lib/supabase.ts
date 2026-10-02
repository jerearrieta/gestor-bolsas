import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver client/.env.example).");
}

/** Sólo se usa para iniciar y cerrar sesión; los datos se piden a la API (carpeta server). */
export const supabase = createClient(url, key);
