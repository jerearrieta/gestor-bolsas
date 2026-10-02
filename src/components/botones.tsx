"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function BotonEnviar({
  children,
  className = "boton-primario",
  pendiente = "Guardando…",
  ...props
}: {
  children: ReactNode;
  className?: string;
  pendiente?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...props}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> {pendiente}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Botón de envío que pide confirmación antes de una acción que no se puede deshacer. */
export function BotonConfirmar({
  children,
  mensaje,
  className = "boton-peligro",
}: {
  children: ReactNode;
  mensaje: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}
