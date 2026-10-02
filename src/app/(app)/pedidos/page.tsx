import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardList, Plus } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { dinero, fechaCorta, hoyISO } from "@/lib/format";
import { ESTADOS, type EstadoPedido, type PedidoResumen } from "@/lib/tipos";
import { Encabezado, EstadoBadge, Vacio } from "@/components/ui";

export const metadata: Metadata = { title: "Pedidos" };

const FILTROS: { valor: string; etiqueta: string }[] = [
  { valor: "activos", etiqueta: "Activos" },
  ...ESTADOS.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta })),
  { valor: "todos", etiqueta: "Todos" },
];

export default async function PedidosPage({ searchParams }: PageProps<"/pedidos">) {
  const sp = await searchParams;
  const filtro = typeof sp.estado === "string" ? sp.estado : "activos";
  const { supabase } = await requireUser();

  let consulta = supabase.from("pedidos_resumen").select("*");
  if (filtro === "activos") consulta = consulta.in("estado", ["pendiente", "en_produccion", "listo"]);
  else if (filtro !== "todos") consulta = consulta.eq("estado", filtro as EstadoPedido);
  consulta =
    filtro === "activos"
      ? consulta.order("fecha_entrega", { ascending: true, nullsFirst: false }).order("numero")
      : consulta.order("numero", { ascending: false });

  const [{ data }, { data: conteos }] = await Promise.all([
    consulta.limit(300),
    supabase.from("pedidos").select("estado"),
  ]);
  const pedidos = (data ?? []) as PedidoResumen[];
  const cuenta = new Map<string, number>();
  for (const p of conteos ?? []) cuenta.set(p.estado, (cuenta.get(p.estado) ?? 0) + 1);
  cuenta.set("activos", (cuenta.get("pendiente") ?? 0) + (cuenta.get("en_produccion") ?? 0) + (cuenta.get("listo") ?? 0));
  cuenta.set("todos", conteos?.length ?? 0);
  const hoy = hoyISO();

  return (
    <>
      <Encabezado
        titulo="Pedidos"
        acciones={
          <Link href="/pedidos/nuevo" className="boton-primario">
            <Plus className="size-4" /> Nuevo pedido
          </Link>
        }
      />

      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filtrar por estado">
        {FILTROS.map((f) => {
          const on = f.valor === filtro;
          return (
            <Link
              key={f.valor}
              href={f.valor === "activos" ? "/pedidos" : `/pedidos?estado=${f.valor}`}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                on ? "border-marca-600 bg-marca-600 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {f.etiqueta}
              <span className={`ml-1.5 text-xs ${on ? "text-marca-100" : "text-stone-400"}`}>{cuenta.get(f.valor) ?? 0}</span>
            </Link>
          );
        })}
      </nav>

      {pedidos.length === 0 ? (
        <Vacio
          icono={<ClipboardList className="size-10" />}
          titulo={filtro === "activos" ? "No hay pedidos en curso" : "No hay pedidos con este estado"}
          texto="Cargá cada pedido confirmado y seguí su avance hasta la entrega."
          accion={<Link href="/pedidos/nuevo" className="boton-primario"><Plus className="size-4" /> Nuevo pedido</Link>}
        />
      ) : (
        <ul className="space-y-2.5">
          {pedidos.map((p) => {
            const atrasado = p.fecha_entrega && p.fecha_entrega < hoy && ["pendiente", "en_produccion", "listo"].includes(p.estado);
            return (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="tarjeta flex items-center gap-3 p-4 transition hover:border-marca-300">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-900">#{p.numero}</span>
                      <span className="truncate text-stone-700">{p.cliente_nombre ?? "Sin cliente"}</span>
                      <EstadoBadge estado={p.estado} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-stone-500">
                      <span>{p.unidades} {Number(p.unidades) === 1 ? "unidad" : "unidades"}</span>
                      <span>Pedido {fechaCorta(p.fecha)}</span>
                      {p.fecha_entrega && (
                        <span className={`inline-flex items-center gap-1 ${atrasado ? "font-semibold text-rose-700" : ""}`}>
                          <CalendarClock className="size-3" /> Entrega {fechaCorta(p.fecha_entrega)}
                          {atrasado && " (atrasado)"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{dinero(p.total)}</p>
                    {Number(p.saldo) > 0 && p.estado !== "cancelado" ? (
                      <p className="text-xs font-medium text-rose-700">Debe {dinero(p.saldo)}</p>
                    ) : (
                      p.estado !== "cancelado" && <p className="text-xs font-medium text-emerald-700">Pagado</p>
                    )}
                  </div>
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
