import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, LogOut } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { dinero, numero } from "@/lib/format";
import { Encabezado, Tarjeta } from "@/components/ui";
import { BotonEnviar } from "@/components/botones";
import { salir } from "@/app/login/actions";
import { FormularioAjustes } from "./formulario";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const { supabase, user } = await requireUser();
  const ajustes = await obtenerAjustes(supabase);
  return (
    <>
      <Encabezado titulo="Ajustes" subtitulo={`Sesión iniciada como ${user.email}`} />
      <div className="space-y-4">
        <FormularioAjustes ajustes={ajustes} />
        <Tarjeta className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-stone-900">Costos para la calculadora</p>
            <p className="text-sm text-stone-500">
              Lienzo a {dinero(ajustes.precio_metro_lienzo)} el metro · margen objetivo {numero(ajustes.margen_objetivo)}%
            </p>
          </div>
          <Link href="/catalogo/calculadora" className="boton-secundario">
            <Calculator className="size-4" /> Cambiar
          </Link>
        </Tarjeta>
        <form action={salir} className="flex justify-center pt-4">
          <BotonEnviar className="boton-secundario" pendiente="Saliendo…">
            <LogOut className="size-4" /> Cerrar sesión
          </BotonEnviar>
        </form>
      </div>
    </>
  );
}
