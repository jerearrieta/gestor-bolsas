import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type EstadoSesion = { sesion: Session | null; cargando: boolean; sinConexion: boolean };

const Contexto = createContext<EstadoSesion>({ sesion: null, cargando: true, sinConexion: false });

/** Si Supabase no responde (por ejemplo, el proyecto quedó pausado) no hay que esperar para siempre. */
const ESPERA_MAXIMA_MS = 10_000;

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>({ sesion: null, cargando: true, sinConexion: false });

  useEffect(() => {
    const espera = setTimeout(() => {
      setEstado((actual) => (actual.cargando ? { sesion: null, cargando: false, sinConexion: true } : actual));
    }, ESPERA_MAXIMA_MS);
    supabase.auth
      .getSession()
      .then(({ data, error }) => setEstado({ sesion: data.session, cargando: false, sinConexion: Boolean(error) && !data.session }))
      .catch(() => setEstado({ sesion: null, cargando: false, sinConexion: true }))
      .finally(() => clearTimeout(espera));
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => setEstado({ sesion, cargando: false, sinConexion: false }));
    return () => {
      clearTimeout(espera);
      data.subscription.unsubscribe();
    };
  }, []);

  return <Contexto.Provider value={estado}>{children}</Contexto.Provider>;
}

export const useSesion = () => useContext(Contexto);
