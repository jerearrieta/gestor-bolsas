import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/** Pide datos a la API y los vuelve a pedir con `recargar()` después de un cambio. */
export function useDatos<T>(ruta: string) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    api
      .get<T>(ruta)
      .then((d) => {
        if (vigente) {
          setDatos(d);
          setError(null);
        }
      })
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [ruta, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos, error, recargar };
}

/** Maneja el envío de un formulario: estado "enviando", error y mensaje de éxito. */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const enviar = useCallback(async (accion: () => Promise<string | void>) => {
    setEnviando(true);
    setError(null);
    setOk(null);
    try {
      const mensaje = await accion();
      if (mensaje) setOk(mensaje);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error.");
      return false;
    } finally {
      setEnviando(false);
    }
  }, []);

  return { enviando, error, ok, enviar, setError };
}
