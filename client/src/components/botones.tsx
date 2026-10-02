import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

/** Botón que muestra un spinner mientras se guarda. */
export function Boton({
  children,
  cargando = false,
  textoCargando = "Guardando…",
  className = "boton-primario",
  type = "submit",
  ...props
}: {
  children: ReactNode;
  cargando?: boolean;
  textoCargando?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} disabled={cargando || props.disabled} className={className} {...props}>
      {cargando ? (
        <>
          <Loader2 className="size-4 animate-spin" /> {textoCargando}
        </>
      ) : (
        children
      )}
    </button>
  );
}
