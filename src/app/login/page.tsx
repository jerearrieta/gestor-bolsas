import type { Metadata } from "next";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="mb-3 size-14" />
          <h1 className="text-2xl font-bold text-stone-900">Gestión del taller</h1>
          <p className="mt-1 text-sm text-stone-500">Pedidos, clientes, precios y finanzas en un solo lugar.</p>
        </div>
        <div className="tarjeta p-5 sm:p-6">
          <FormularioLogin />
        </div>
      </div>
    </main>
  );
}
