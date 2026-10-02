import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Check, Pencil, Plus, Tag } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { dinero, numero } from "@/lib/format";
import { costoBolsa, margenReal } from "@/lib/precios";
import { Encabezado, Vacio } from "@/components/ui";
import { BotonEnviar } from "@/components/botones";
import { actualizarPrecio } from "./actions";
import { AumentoMasivo } from "./aumento";
import type { Producto } from "@/lib/tipos";

export const metadata: Metadata = { title: "Catálogo y precios" };

export default async function CatalogoPage() {
  const { supabase } = await requireUser();
  const [{ data }, ajustes] = await Promise.all([
    supabase.from("productos").select("*").order("activo", { ascending: false }).order("nombre"),
    obtenerAjustes(supabase),
  ]);
  const productos = (data ?? []) as Producto[];

  return (
    <>
      <Encabezado
        titulo="Catálogo y precios"
        subtitulo="Cambiá un precio y tocá ✓ para guardarlo."
        acciones={
          <>
            <Link href="/catalogo/calculadora" className="boton-secundario">
              <Calculator className="size-4" /> Calculadora
            </Link>
            <Link href="/catalogo/nuevo" className="boton-primario">
              <Plus className="size-4" /> Nuevo producto
            </Link>
          </>
        }
      />

      {productos.length > 0 && <AumentoMasivo />}

      {productos.length === 0 ? (
        <Vacio
          icono={<Tag className="size-10" />}
          titulo="Tu catálogo está vacío"
          texto="Cargá tus modelos de bolsas con su precio. Después los elegís con un toque al armar un pedido."
          accion={<Link href="/catalogo/nuevo" className="boton-primario"><Plus className="size-4" /> Cargar el primero</Link>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {productos.map((p) => {
            const costo = costoBolsa(ajustes.precio_metro_lienzo, Number(p.metros_lienzo), Number(p.otros_costos));
            const margen = margenReal(Number(p.precio), costo);
            const bajo = costo > 0 && margen < ajustes.margen_objetivo;
            return (
              <li key={p.id} className={`tarjeta p-4 ${p.activo ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">{p.nombre}</p>
                    {p.descripcion && <p className="line-clamp-2 text-xs text-stone-500">{p.descripcion}</p>}
                    {!p.activo && <p className="mt-1 text-xs font-medium text-stone-500">Inactivo</p>}
                  </div>
                  <Link href={`/catalogo/${p.id}`} aria-label={`Editar ${p.nombre}`} className="-mr-1 -mt-1 rounded-lg p-2 text-stone-500 hover:bg-stone-100">
                    <Pencil className="size-4" />
                  </Link>
                </div>
                <form action={actualizarPrecio} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                    <input
                      name="precio"
                      key={String(p.precio)}
                      defaultValue={Number(p.precio)}
                      inputMode="decimal"
                      aria-label={`Precio de ${p.nombre}`}
                      className="campo pl-7 text-lg font-semibold tabular-nums"
                    />
                  </div>
                  <BotonEnviar className="boton-primario px-3" pendiente="" aria-label="Guardar precio">
                    <Check className="size-5" />
                  </BotonEnviar>
                </form>
                {costo > 0 && (
                  <p className="mt-2 text-xs text-stone-500">
                    Costo {dinero(costo)} · margen{" "}
                    <span className={`font-semibold ${bajo ? "text-rose-700" : "text-emerald-700"}`}>{numero(margen, 1)}%</span>
                    {bajo && " (bajo tu objetivo)"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
