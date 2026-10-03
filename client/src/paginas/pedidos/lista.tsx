import { Link, useSearchParams } from "react-router";
import { CalendarClock, ChevronRight, ClipboardList, Plus } from "lucide-react";
import { useDatos } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { dinero, fechaCorta } from "../../lib/formato";
import { ESTADOS, estadoCobro, type PedidoResumen } from "../../lib/tipos";
import { Encabezado, EstadoBadge, EstadoCarga, Vacio } from "../../components/ui";

const FILTROS = [
  { valor: "activos", etiqueta: "Activos" },
  ...ESTADOS.map((e) => ({ valor: e.valor as string, etiqueta: e.etiqueta })),
  { valor: "todos", etiqueta: "Todos" },
];

type DatosPedidos = { pedidos: PedidoResumen[]; conteos: Record<string, number>; hoy: string };

export function Pedidos() {
  useTitulo("Pedidos");
  const [params] = useSearchParams();
  const filtro = params.get("estado") ?? "activos";
  const { datos, error } = useDatos<DatosPedidos>(`/pedidos?estado=${encodeURIComponent(filtro)}`);

  return (
    <>
      <Encabezado
        titulo="Pedidos"
        acciones={
          <Link to="/pedidos/nuevo" className="boton-primario">
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
              to={f.valor === "activos" ? "/pedidos" : `/pedidos?estado=${f.valor}`}
              replace
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                on ? "border-marca-600 bg-marca-600 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {f.etiqueta}
              <span className={`ml-1.5 text-xs ${on ? "text-marca-100" : "text-stone-400"}`}>{datos?.conteos[f.valor] ?? 0}</span>
            </Link>
          );
        })}
      </nav>

      {!datos ? (
        <EstadoCarga error={error} />
      ) : datos.pedidos.length === 0 ? (
        <Vacio
          icono={<ClipboardList className="size-10" />}
          titulo={filtro === "activos" ? "No hay pedidos en curso" : "No hay pedidos con este estado"}
          texto="Cargá cada pedido confirmado y seguí su avance hasta la entrega."
          accion={<Link to="/pedidos/nuevo" className="boton-primario"><Plus className="size-4" /> Nuevo pedido</Link>}
        />
      ) : (
        <ul className="space-y-2.5">
          {datos.pedidos.map((p) => {
            const atrasado = p.fecha_entrega && p.fecha_entrega < datos.hoy && ["pendiente", "en_produccion", "listo"].includes(p.estado);
            return (
              <li key={p.id}>
                <Link to={`/pedidos/${p.id}`} className="tarjeta flex items-center gap-3 p-4 transition hover:border-marca-300">
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
                    {p.estado !== "cancelado" &&
                      (estadoCobro(p) === "pagado" ? (
                        <p className="text-xs font-medium text-emerald-700">Pagado</p>
                      ) : (
                        <>
                          {estadoCobro(p) === "parcial" && <p className="text-xs text-amber-700">Pagó {dinero(p.pagado)}</p>}
                          <p className="text-xs font-medium text-rose-700">Debe {dinero(p.saldo)}</p>
                        </>
                      ))}
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
