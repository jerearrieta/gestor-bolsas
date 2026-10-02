import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { infoEstado, type EstadoPedido } from "@/lib/tipos";

export function Encabezado({
  titulo,
  subtitulo,
  volver,
  acciones,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  volver?: string;
  acciones?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {volver && (
          <Link
            href={volver}
            className="mb-1 -ml-1 inline-flex items-center gap-0.5 rounded-lg px-1 py-0.5 text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            <ChevronLeft className="size-4" /> Volver
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-stone-500">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`tarjeta p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function TituloSeccion({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-stone-900">{children}</h2>
      {accion}
    </div>
  );
}

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const info = infoEstado(estado);
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${info.clase}`}>
      {info.etiqueta}
    </span>
  );
}

export function Vacio({
  icono,
  titulo,
  texto,
  accion,
}: {
  icono?: ReactNode;
  titulo: string;
  texto?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
      {icono && <div className="mb-3 text-stone-400">{icono}</div>}
      <p className="font-semibold text-stone-800">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-stone-500">{texto}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Dato({
  etiqueta,
  valor,
  tono = "normal",
  detalle,
}: {
  etiqueta: string;
  valor: ReactNode;
  tono?: "normal" | "positivo" | "negativo" | "marca";
  detalle?: ReactNode;
}) {
  const colores = {
    normal: "text-stone-900",
    positivo: "text-emerald-700",
    negativo: "text-rose-700",
    marca: "text-marca-700",
  };
  return (
    <div className="tarjeta p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{etiqueta}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${colores[tono]}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-stone-500">{detalle}</p>}
    </div>
  );
}

export function Aviso({ tipo = "error", children }: { tipo?: "error" | "ok" | "info"; children: ReactNode }) {
  const clases = {
    error: "border-rose-200 bg-rose-50 text-rose-800",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-sm ${clases[tipo]}`}>
      {children}
    </div>
  );
}
