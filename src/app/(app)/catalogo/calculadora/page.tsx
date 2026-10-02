import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { dinero, numero } from "@/lib/format";
import { costoBolsa, margenReal, precioSugerido, redondearPrecio } from "@/lib/precios";
import { Encabezado, Vacio } from "@/components/ui";
import { BotonEnviar } from "@/components/botones";
import { actualizarPrecio } from "../actions";
import { CostosBase } from "./costos-base";
import { CalculadoraRapida } from "./rapida";
import type { Producto } from "@/lib/tipos";

export const metadata: Metadata = { title: "Calculadora de costos" };

export default async function CalculadoraPage() {
  const { supabase } = await requireUser();
  const [{ data }, ajustes] = await Promise.all([
    supabase.from("productos").select("*").eq("activo", true).order("nombre"),
    obtenerAjustes(supabase),
  ]);
  const productos = (data ?? []) as Producto[];
  const { precio_metro_lienzo: precioMetro, margen_objetivo: margen } = ajustes;

  return (
    <>
      <Encabezado
        titulo="Calculadora de costos"
        subtitulo="Poné cuánto te cuesta el metro de lienzo y te decimos a cuánto vender cada bolsa."
        volver="/catalogo"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CostosBase precioMetro={precioMetro} margen={margen} />
        <CalculadoraRapida precioMetro={precioMetro} margen={margen} />
      </div>

      <section className="mt-6">
        <h2 className="mb-1 font-semibold text-stone-900">3. Precios sugeridos de tu catálogo</h2>
        <p className="mb-3 text-sm text-stone-500">
          Con el lienzo a {dinero(precioMetro)} el metro y {numero(margen)}% de margen. Tocá “Aplicar” para usar el precio sugerido.
        </p>
        {productos.length === 0 ? (
          <Vacio titulo="No hay productos activos" accion={<Link href="/catalogo/nuevo" className="boton-primario">Cargar producto</Link>} />
        ) : (
          <ul className="tarjeta divide-y divide-stone-100">
            {productos.map((p) => {
              const costo = costoBolsa(precioMetro, Number(p.metros_lienzo), Number(p.otros_costos));
              const sugerido = redondearPrecio(precioSugerido(costo, margen));
              const actual = Number(p.precio);
              const margenActual = margenReal(actual, costo);
              const sinDatos = costo === 0;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
                  <div className="min-w-40 flex-1">
                    <Link href={`/catalogo/${p.id}`} className="font-medium text-stone-900 hover:underline">{p.nombre}</Link>
                    <p className="text-xs text-stone-500">
                      {sinDatos
                        ? "Falta cargar metros de lienzo u otros costos"
                        : `${numero(Number(p.metros_lienzo), 3)} m + ${dinero(p.otros_costos)} = costo ${dinero(costo)}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-xs text-stone-500">Actual</p>
                    <p className="font-semibold tabular-nums">{dinero(actual)}</p>
                    {!sinDatos && (
                      <p className={`text-xs font-medium ${margenActual < margen ? "text-rose-700" : "text-emerald-700"}`}>{numero(margenActual, 1)}%</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-xs text-stone-500">Sugerido</p>
                    <p className="font-semibold tabular-nums text-marca-700">{sinDatos ? "—" : dinero(sugerido)}</p>
                  </div>
                  <form action={actualizarPrecio}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="precio" value={sugerido} />
                    <BotonEnviar className="boton-secundario min-h-9 px-3 py-1.5" pendiente="…" disabled={sinDatos || sugerido === actual}>
                      {sugerido === actual && !sinDatos ? "Al día" : "Aplicar"}
                    </BotonEnviar>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
