import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { dinero, fechaCorta, hoyISO, moverMes, nombreMes, numero, rangoMes } from "@/lib/format";
import { Dato, Encabezado, Tarjeta, TituloSeccion, Vacio } from "@/components/ui";
import { BotonConfirmar } from "@/components/botones";
import { borrarMovimiento } from "./actions";
import { FormularioMovimiento } from "./formulario";
import type { Movimiento } from "@/lib/tipos";

export const metadata: Metadata = { title: "Finanzas" };

export default async function FinanzasPage({ searchParams }: PageProps<"/finanzas">) {
  const sp = await searchParams;
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const mes = typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : mesActual;
  const { desde, hasta } = rangoMes(mes);
  const { supabase } = await requireUser();

  const [{ data }, { data: pendientes }] = await Promise.all([
    supabase
      .from("movimientos")
      .select("*")
      .gte("fecha", desde)
      .lt("fecha", hasta)
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false }),
    supabase.from("pedidos_resumen").select("saldo").neq("estado", "cancelado").gt("saldo", 0),
  ]);
  const movimientos = (data ?? []) as Movimiento[];
  const ingresos = movimientos.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const gastos = movimientos.filter((m) => m.tipo === "gasto").reduce((s, m) => s + Number(m.monto), 0);
  const ganancia = ingresos - gastos;
  const porCobrar = (pendientes ?? []).reduce((s, p) => s + Number(p.saldo), 0);

  const porCategoria = new Map<string, number>();
  for (const m of movimientos) if (m.tipo === "gasto") porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + Number(m.monto));
  const categorias = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Encabezado titulo="Finanzas" subtitulo="Lo que entró, lo que salió y lo que realmente ganaste." />

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-1.5">
        <Link href={`/finanzas?mes=${moverMes(mes, -1)}`} className="rounded-xl p-2.5 text-stone-600 hover:bg-stone-100" aria-label="Mes anterior">
          <ChevronLeft className="size-5" />
        </Link>
        <p className="font-semibold text-stone-900">{nombreMes(mes)}</p>
        {mes < mesActual ? (
          <Link href={`/finanzas?mes=${moverMes(mes, 1)}`} className="rounded-xl p-2.5 text-stone-600 hover:bg-stone-100" aria-label="Mes siguiente">
            <ChevronRight className="size-5" />
          </Link>
        ) : (
          <span className="size-10" />
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato etiqueta="Ingresos" valor={dinero(ingresos)} tono="positivo" />
        <Dato etiqueta="Gastos" valor={dinero(gastos)} tono="negativo" />
        <Dato
          etiqueta="Ganancia real"
          valor={dinero(ganancia)}
          tono={ganancia >= 0 ? "marca" : "negativo"}
          detalle={ingresos > 0 ? `${numero((ganancia / ingresos) * 100, 1)}% de lo que entró` : undefined}
        />
        <Dato etiqueta="Por cobrar" valor={dinero(porCobrar)} detalle="Saldos de pedidos" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Tarjeta>
            <TituloSeccion>Registrar movimiento</TituloSeccion>
            <FormularioMovimiento hoy={hoy} />
          </Tarjeta>
          {categorias.length > 0 && (
            <Tarjeta>
              <TituloSeccion>¿En qué se fue la plata?</TituloSeccion>
              <ul className="space-y-3">
                {categorias.map(([cat, monto]) => (
                  <li key={cat}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-stone-700">{cat}</span>
                      <span className="font-medium tabular-nums">{dinero(monto)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${(monto / gastos) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}
        </div>

        <Tarjeta>
          <TituloSeccion>Movimientos del mes</TituloSeccion>
          {movimientos.length === 0 ? (
            <Vacio titulo="Sin movimientos este mes" texto="Registrá tus compras de lienzo, envíos y otros gastos para conocer tu ganancia real." />
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {movimientos.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-2 py-2.5">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${m.tipo === "ingreso" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {m.tipo === "ingreso" ? "+" : "−"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">
                      {m.categoria}
                      {m.descripcion && <span className="font-normal text-stone-500"> · {m.descripcion}</span>}
                    </p>
                    <p className="text-xs text-stone-500">
                      {fechaCorta(m.fecha)}
                      {m.pedido_id && (
                        <>
                          {" · "}
                          <Link href={`/pedidos/${m.pedido_id}`} className="text-marca-700 hover:underline">ver pedido</Link>
                        </>
                      )}
                    </p>
                  </div>
                  <span className={`font-semibold tabular-nums ${m.tipo === "ingreso" ? "text-emerald-700" : "text-rose-700"}`}>
                    {m.tipo === "ingreso" ? "+" : "−"}{dinero(m.monto)}
                  </span>
                  <form action={borrarMovimiento}>
                    <input type="hidden" name="id" value={m.id} />
                    <BotonConfirmar className="rounded-lg p-1.5 text-stone-300 hover:bg-rose-50 hover:text-rose-600" mensaje="¿Borrar este movimiento?">
                      <Trash2 className="size-4" aria-label="Borrar" />
                    </BotonConfirmar>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
