import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronRight, MessageCircle, PackageCheck, Plus, Receipt, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { avisoPedidoListo } from "@/lib/mensajes";
import { dinero, fechaCorta, hoyISO, nombreMes, rangoMes } from "@/lib/format";
import { ESTADOS, type PedidoResumen } from "@/lib/tipos";
import { Dato, EstadoBadge, Tarjeta, TituloSeccion, Vacio } from "@/components/ui";

export default async function InicioPage() {
  const { supabase } = await requireUser();
  const hoy = hoyISO();
  const mes = hoy.slice(0, 7);
  const { desde, hasta } = rangoMes(mes);

  const [{ data: activosData }, { data: movs }, ajustes] = await Promise.all([
    supabase
      .from("pedidos_resumen")
      .select("*")
      .in("estado", ["pendiente", "en_produccion", "listo"])
      .order("fecha_entrega", { ascending: true, nullsFirst: false }),
    supabase.from("movimientos").select("tipo, monto").gte("fecha", desde).lt("fecha", hasta),
    obtenerAjustes(supabase),
  ]);
  const activos = (activosData ?? []) as PedidoResumen[];
  const ingresos = (movs ?? []).filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const gastos = (movs ?? []).filter((m) => m.tipo === "gasto").reduce((s, m) => s + Number(m.monto), 0);
  const porCobrar = activos.reduce((s, p) => s + Math.max(Number(p.saldo), 0), 0);

  const listos = activos.filter((p) => p.estado === "listo");
  const enCurso = activos.filter((p) => p.estado !== "listo");
  const atrasados = enCurso.filter((p) => p.fecha_entrega && p.fecha_entrega < hoy);
  const conteo = (e: string) => activos.filter((p) => p.estado === e).length;

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-stone-500">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">¡Hola! Así va el taller</h1>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Acceso href="/pedidos/nuevo" icono={<Plus className="size-5" />} texto="Nuevo pedido" principal />
        <Acceso href="/clientes/nuevo" icono={<UserPlus className="size-5" />} texto="Nuevo cliente" />
        <Acceso href="/finanzas" icono={<Receipt className="size-5" />} texto="Anotar gasto" />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato etiqueta={`Ingresos · ${nombreMes(mes).split(" ")[0]}`} valor={dinero(ingresos)} tono="positivo" />
        <Dato etiqueta="Gastos del mes" valor={dinero(gastos)} tono="negativo" />
        <Dato etiqueta="Ganancia del mes" valor={dinero(ingresos - gastos)} tono={ingresos - gastos >= 0 ? "marca" : "negativo"} />
        <Dato etiqueta="Por cobrar" valor={dinero(porCobrar)} detalle={`${activos.length} pedidos en curso`} />
      </div>

      {atrasados.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>{atrasados.length === 1 ? "Hay 1 pedido atrasado" : `Hay ${atrasados.length} pedidos atrasados`}</strong>{" "}
            ({atrasados.map((p) => `#${p.numero}`).join(", ")}). Revisá las fechas de entrega.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta>
          <TituloSeccion accion={<span className="text-xs text-stone-500">{listos.length}</span>}>
            <span className="inline-flex items-center gap-2"><PackageCheck className="size-5 text-emerald-600" /> Listos para entregar</span>
          </TituloSeccion>
          {listos.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">No hay pedidos listos esperando.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {listos.map((p) => {
                const wa = avisoPedidoListo(p, ajustes);
                return (
                  <li key={p.id} className="flex items-center gap-2 px-2 py-2.5">
                    <Link href={`/pedidos/${p.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-900">#{p.numero} · {p.cliente_nombre ?? "Sin cliente"}</p>
                      <p className="text-xs text-stone-500">
                        {dinero(p.total)}
                        {Number(p.saldo) > 0 && <span className="text-rose-700"> · debe {dinero(p.saldo)}</span>}
                      </p>
                    </Link>
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="boton-whatsapp min-h-9 px-3 py-1.5 text-xs">
                        <MessageCircle className="size-4" /> Avisar
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloSeccion accion={<Link href="/pedidos" className="text-sm font-medium text-marca-700 hover:underline">Ver todos</Link>}>
            <span className="inline-flex items-center gap-2"><CalendarClock className="size-5 text-sky-600" /> Próximas entregas</span>
          </TituloSeccion>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            {ESTADOS.slice(0, 2).map((e) => (
              <span key={e.valor} className={`rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${e.clase}`}>
                {e.etiqueta}: {conteo(e.valor)}
              </span>
            ))}
          </div>
          {enCurso.length === 0 ? (
            <Vacio titulo="Sin pedidos en curso" accion={<Link href="/pedidos/nuevo" className="boton-primario"><Plus className="size-4" /> Cargar pedido</Link>} />
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {enCurso.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-stone-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-900">#{p.numero} · {p.cliente_nombre ?? "Sin cliente"}</p>
                      <p className={`text-xs ${p.fecha_entrega && p.fecha_entrega < hoy ? "font-semibold text-rose-700" : "text-stone-500"}`}>
                        {p.fecha_entrega ? `Entrega ${fechaCorta(p.fecha_entrega)}` : "Sin fecha"} · {p.unidades} u.
                      </p>
                    </div>
                    <EstadoBadge estado={p.estado} />
                    <ChevronRight className="size-4 text-stone-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}

function Acceso({ href, icono, texto, principal }: { href: string; icono: React.ReactNode; texto: string; principal?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-xs font-semibold shadow-sm transition active:scale-[0.98] sm:flex-row sm:text-sm ${
        principal ? "bg-marca-600 text-white hover:bg-marca-700" : "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50"
      }`}
    >
      {icono} {texto}
    </Link>
  );
}
