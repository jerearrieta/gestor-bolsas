import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { Encabezado, Vacio } from "@/components/ui";
import type { Cliente } from "@/lib/tipos";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  const { supabase } = await requireUser();

  let consulta = supabase.from("clientes").select("*").order("nombre");
  if (busqueda) {
    const patron = `%${busqueda.replace(/[%_,()]/g, " ")}%`;
    consulta = consulta.or(`nombre.ilike.${patron},telefono.ilike.${patron},localidad.ilike.${patron},email.ilike.${patron}`);
  }
  const [{ data: clientes }, { data: pedidos }] = await Promise.all([
    consulta,
    supabase.from("pedidos_resumen").select("cliente_id, total, estado"),
  ]);

  const stats = new Map<string, { pedidos: number; total: number }>();
  for (const p of pedidos ?? []) {
    if (!p.cliente_id || p.estado === "cancelado") continue;
    const s = stats.get(p.cliente_id) ?? { pedidos: 0, total: 0 };
    s.pedidos += 1;
    s.total += Number(p.total);
    stats.set(p.cliente_id, s);
  }

  const lista = (clientes ?? []) as Cliente[];

  return (
    <>
      <Encabezado
        titulo="Clientes"
        subtitulo={`${lista.length} ${lista.length === 1 ? "cliente" : "clientes"}${busqueda ? " encontrados" : ""}`}
        acciones={
          <Link href="/clientes/nuevo" className="boton-primario">
            <Plus className="size-4" /> Nuevo cliente
          </Link>
        }
      />

      <form className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input name="q" defaultValue={busqueda} placeholder="Buscar por nombre, teléfono o localidad…" className="campo pl-10" type="search" />
      </form>

      {lista.length === 0 ? (
        <Vacio
          icono={<Users className="size-10" />}
          titulo={busqueda ? "No encontramos clientes con esa búsqueda" : "Todavía no cargaste clientes"}
          texto={busqueda ? "Probá con otra palabra." : "Guardá acá los datos de contacto y la dirección de envío de cada cliente."}
          accion={!busqueda && <Link href="/clientes/nuevo" className="boton-primario"><Plus className="size-4" /> Cargar el primero</Link>}
        />
      ) : (
        <ul className="tarjeta divide-y divide-stone-100 overflow-hidden">
          {lista.map((c) => {
            const s = stats.get(c.id);
            return (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca-100 font-semibold text-marca-800">
                    {c.nombre.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-stone-900">{c.nombre}</span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-stone-500">
                      {c.telefono && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{c.telefono}</span>}
                      {c.localidad && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{c.localidad}</span>}
                    </span>
                  </span>
                  {s && (
                    <span className="hidden text-right text-xs text-stone-500 sm:block">
                      {s.pedidos} {s.pedidos === 1 ? "pedido" : "pedidos"}
                    </span>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-stone-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
