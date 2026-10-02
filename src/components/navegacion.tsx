"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Users, Tag, Wallet, Calculator, Settings } from "lucide-react";

const PRINCIPALES = [
  { href: "/", etiqueta: "Inicio", icono: Home },
  { href: "/pedidos", etiqueta: "Pedidos", icono: ClipboardList },
  { href: "/clientes", etiqueta: "Clientes", icono: Users },
  { href: "/catalogo", etiqueta: "Catálogo", icono: Tag },
  { href: "/finanzas", etiqueta: "Finanzas", icono: Wallet },
];

const EXTRAS = [
  { href: "/catalogo/calculadora", etiqueta: "Calculadora de costos", icono: Calculator },
  { href: "/ajustes", etiqueta: "Ajustes", icono: Settings },
];

function activo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/catalogo") return pathname.startsWith("/catalogo") && !pathname.startsWith("/catalogo/calculadora");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra lateral en pantallas grandes. */
export function BarraLateral({ negocio }: { negocio: string }) {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-stone-200 bg-white px-3 py-5 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="size-9" />
        <span className="font-bold leading-tight text-stone-900">{negocio}</span>
      </Link>
      <ul className="space-y-1">
        {PRINCIPALES.map(({ href, etiqueta, icono: Icono }) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activo(pathname, href) ? "bg-marca-50 text-marca-800" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icono className="size-5" /> {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
      <hr className="my-4 border-stone-200" />
      <ul className="space-y-1">
        {EXTRAS.map(({ href, etiqueta, icono: Icono }) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activo(pathname, href) ? "bg-marca-50 text-marca-800" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icono className="size-5" /> {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Barra superior en el celular (nombre + accesos a calculadora y ajustes). */
export function BarraSuperior({ negocio }: { negocio: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="size-8" />
        <span className="font-bold text-stone-900">{negocio}</span>
      </Link>
      <div className="flex items-center gap-1">
        {EXTRAS.map(({ href, etiqueta, icono: Icono }) => (
          <Link
            key={href}
            href={href}
            aria-label={etiqueta}
            title={etiqueta}
            className={`rounded-xl p-2.5 ${activo(pathname, href) ? "bg-marca-50 text-marca-800" : "text-stone-600 hover:bg-stone-100"}`}
          >
            <Icono className="size-5" />
          </Link>
        ))}
      </div>
    </header>
  );
}

/** Barra inferior con las 5 secciones principales, para usar con el pulgar. */
export function BarraInferior() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {PRINCIPALES.map(({ href, etiqueta, icono: Icono }) => {
          const on = activo(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${on ? "text-marca-700" : "text-stone-500"}`}
              >
                <span className={`rounded-full px-4 py-1 transition ${on ? "bg-marca-100" : ""}`}>
                  <Icono className="size-5" />
                </span>
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
