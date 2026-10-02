import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useOutletContext } from "react-router";
import { useSesion } from "../lib/sesion";
import { useDatos } from "../lib/datos";
import type { Ajustes } from "../lib/tipos";
import { BarraInferior, BarraLateral, BarraSuperior } from "./navegacion";

type ContextoMarco = { ajustes: Ajustes | null; recargarAjustes: () => void };

/** Estructura de las pantallas internas: exige sesión y dibuja la navegación. */
export function Marco() {
  const { sesion, cargando } = useSesion();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (cargando) return null;
  if (!sesion) return <Navigate to="/login" replace />;
  return <MarcoConSesion />;
}

function MarcoConSesion() {
  const { datos: ajustes, recargar } = useDatos<Ajustes>("/ajustes");
  const negocio = ajustes?.nombre_negocio ?? "JFA Bolsas";
  return (
    <div className="flex min-h-dvh">
      <BarraLateral negocio={negocio} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior negocio={negocio} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <Outlet context={{ ajustes, recargarAjustes: recargar } satisfies ContextoMarco} />
        </main>
      </div>
      <BarraInferior />
    </div>
  );
}

export const useMarco = () => useOutletContext<ContextoMarco>();
