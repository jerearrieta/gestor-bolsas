import type { ReactNode } from "react";
import { Link } from "react-router";
import { AlertTriangle, CalendarClock, ChevronRight, MessageCircle, PackageCheck, Plus, Receipt, UserPlus } from "lucide-react";
import { useDatos } from "../lib/datos";
import { useTitulo } from "../lib/titulo";
import { dinero, fechaCorta, fechaLarga, nombreMes } from "../lib/formato";
import { ESTADOS, type PedidoResumen } from "../lib/tipos";
import { Dato, EstadoBadge, EstadoCarga, Tarjeta, TituloSeccion, Vacio } from "../components/ui";

type DatosInicio = {
  hoy: string;
  ingresos: number;
  gastos: number;
  ganancia: number;
  por_cobrar: number;
  pedidos_activos: number;
  conteos: Record<string, number>;
  listos: (PedidoResumen & { whatsapp: string | null })[];
  en_curso: PedidoResumen[];
  atrasados: number[];
};

export function Inicio() {
  useTitulo("");
  const { datos: d, error } = useDatos<DatosInicio>("/inicio");
  if (!d) return <EstadoCarga error={error} />;

  return (
    <>
      <header className="mb-5">
        <p className="text-sm text-stone-500">
          {fechaLarga(d.hoy)}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">¡Hola! Así va el taller</h1>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Acceso to="/pedidos/nuevo" icono={<Plus className="size-5" />} texto="Nuevo pedido" principal />
        <Acceso to="/clientes/nuevo" icono={<UserPlus className="size-5" />} texto="Nuevo cliente" />
        <Acceso to="/finanzas" icono={<Receipt className="size-5" />} texto="Anotar gasto" />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato etiqueta={`Ingresos · ${nombreMes(d.hoy.slice(0, 7)).split(" ")[0]}`} valor={dinero(d.ingresos)} tono="positivo" />
        <Dato etiqueta="Gastos del mes" valor={dinero(d.gastos)} tono="negativo" />
        <Dato etiqueta="Ganancia del mes" valor={dinero(d.ganancia)} tono={d.ganancia >= 0 ? "marca" : "negativo"} />
        <Dato etiqueta="Por cobrar" valor={dinero(d.por_cobrar)} detalle={`${d.pedidos_activos} pedidos en curso`} />
      </div>

      {d.atrasados.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>{d.atrasados.length === 1 ? "Hay 1 pedido atrasado" : `Hay ${d.atrasados.length} pedidos atrasados`}</strong>{" "}
            ({d.atrasados.map((n) => `#${n}`).join(", ")}). Revisá las fechas de entrega.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta>
          <TituloSeccion accion={<span className="text-xs text-stone-500">{d.listos.length}</span>}>
            <span className="inline-flex items-center gap-2"><PackageCheck className="size-5 text-emerald-600" /> Listos para entregar</span>
          </TituloSeccion>
          {d.listos.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">No hay pedidos listos esperando.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {d.listos.map((p) => (
                <li key={p.id} className="flex items-center gap-2 px-2 py-2.5">
                  <Link to={`/pedidos/${p.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">#{p.numero} · {p.cliente_nombre ?? "Sin cliente"}</p>
                    <p className="text-xs text-stone-500">
                      {dinero(p.total)}
                      {Number(p.pagado) > 0 && Number(p.saldo) > 0 && <span className="text-amber-700"> · pagó {dinero(p.pagado)}</span>}
                      {Number(p.saldo) > 0 && <span className="text-rose-700"> · debe {dinero(p.saldo)}</span>}
                    </p>
                  </Link>
                  {p.whatsapp && (
                    <a href={p.whatsapp} target="_blank" rel="noopener noreferrer" className="boton-whatsapp min-h-9 px-3 py-1.5 text-xs">
                      <MessageCircle className="size-4" /> Avisar
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloSeccion accion={<Link to="/pedidos" className="text-sm font-medium text-marca-700 hover:underline">Ver todos</Link>}>
            <span className="inline-flex items-center gap-2"><CalendarClock className="size-5 text-sky-600" /> Próximas entregas</span>
          </TituloSeccion>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            {ESTADOS.slice(0, 2).map((e) => (
              <span key={e.valor} className={`rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${e.clase}`}>
                {e.etiqueta}: {d.conteos[e.valor] ?? 0}
              </span>
            ))}
          </div>
          {d.en_curso.length === 0 ? (
            <Vacio titulo="Sin pedidos en curso" accion={<Link to="/pedidos/nuevo" className="boton-primario"><Plus className="size-4" /> Cargar pedido</Link>} />
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {d.en_curso.map((p) => (
                <li key={p.id}>
                  <Link to={`/pedidos/${p.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-stone-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-stone-900">#{p.numero} · {p.cliente_nombre ?? "Sin cliente"}</p>
                      <p className={`text-xs ${p.fecha_entrega && p.fecha_entrega < d.hoy ? "font-semibold text-rose-700" : "text-stone-500"}`}>
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

function Acceso({ to, icono, texto, principal }: { to: string; icono: ReactNode; texto: string; principal?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-xs font-semibold shadow-sm transition active:scale-[0.98] sm:flex-row sm:text-sm ${
        principal ? "bg-marca-600 text-white hover:bg-marca-700" : "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50"
      }`}
    >
      {icono} {texto}
    </Link>
  );
}
