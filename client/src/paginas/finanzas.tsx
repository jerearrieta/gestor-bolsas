import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useDatos, useEnvio } from "../lib/datos";
import { useTitulo } from "../lib/titulo";
import { dinero, fechaCorta, moverMes, nombreMes, numero } from "../lib/formato";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO, type Movimiento } from "../lib/tipos";
import { Aviso, Dato, Encabezado, EstadoCarga, Tarjeta, TituloSeccion, Vacio } from "../components/ui";
import { Boton } from "../components/botones";

type DatosFinanzas = {
  mes: string;
  mes_actual: string;
  hoy: string;
  ingresos: number;
  gastos: number;
  ganancia: number;
  margen: number | null;
  por_cobrar: number;
  gastos_por_categoria: { categoria: string; total: number }[];
  movimientos: Movimiento[];
};

export function Finanzas() {
  useTitulo("Finanzas");
  const [params] = useSearchParams();
  const mesPedido = params.get("mes");
  const { datos: d, error, recargar } = useDatos<DatosFinanzas>(`/finanzas${mesPedido ? `?mes=${mesPedido}` : ""}`);

  return (
    <>
      <Encabezado titulo="Finanzas" subtitulo="Lo que entró, lo que salió y lo que realmente ganaste." />
      {!d ? (
        <EstadoCarga error={error} />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-1.5">
            <Link to={`/finanzas?mes=${moverMes(d.mes, -1)}`} replace className="rounded-xl p-2.5 text-stone-600 hover:bg-stone-100" aria-label="Mes anterior">
              <ChevronLeft className="size-5" />
            </Link>
            <p className="font-semibold text-stone-900">{nombreMes(d.mes)}</p>
            {d.mes < d.mes_actual ? (
              <Link to={`/finanzas?mes=${moverMes(d.mes, 1)}`} replace className="rounded-xl p-2.5 text-stone-600 hover:bg-stone-100" aria-label="Mes siguiente">
                <ChevronRight className="size-5" />
              </Link>
            ) : (
              <span className="size-10" />
            )}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Dato etiqueta="Ingresos" valor={dinero(d.ingresos)} tono="positivo" />
            <Dato etiqueta="Gastos" valor={dinero(d.gastos)} tono="negativo" />
            <Dato
              etiqueta="Ganancia real"
              valor={dinero(d.ganancia)}
              tono={d.ganancia >= 0 ? "marca" : "negativo"}
              detalle={d.margen !== null ? `${numero(d.margen, 1)}% de lo que entró` : undefined}
            />
            <Dato etiqueta="Por cobrar" valor={dinero(d.por_cobrar)} detalle="Saldos de pedidos" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-4">
              <Tarjeta>
                <TituloSeccion>Registrar movimiento</TituloSeccion>
                <FormularioMovimiento hoy={d.hoy} alGuardar={recargar} />
              </Tarjeta>
              {d.gastos_por_categoria.length > 0 && (
                <Tarjeta>
                  <TituloSeccion>¿En qué se fue la plata?</TituloSeccion>
                  <ul className="space-y-3">
                    {d.gastos_por_categoria.map(({ categoria, total }) => (
                      <li key={categoria}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-stone-700">{categoria}</span>
                          <span className="font-medium tabular-nums">{dinero(total)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                          <div className="h-full rounded-full bg-rose-400" style={{ width: `${(total / d.gastos) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Tarjeta>
              )}
            </div>

            <Tarjeta>
              <TituloSeccion>Movimientos del mes</TituloSeccion>
              {d.movimientos.length === 0 ? (
                <Vacio titulo="Sin movimientos este mes" texto="Registrá tus compras de lienzo, envíos y otros gastos para conocer tu ganancia real." />
              ) : (
                <ul className="-mx-2 divide-y divide-stone-100">
                  {d.movimientos.map((m) => (
                    <FilaMovimiento key={m.id} m={m} alBorrar={recargar} />
                  ))}
                </ul>
              )}
            </Tarjeta>
          </div>
        </>
      )}
    </>
  );
}

function FilaMovimiento({ m, alBorrar }: { m: Movimiento; alBorrar: () => void }) {
  const { enviando, enviar, error } = useEnvio();
  return (
    <li className="flex items-center gap-3 px-2 py-2.5">
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
              <Link to={`/pedidos/${m.pedido_id}`} className="text-marca-700 hover:underline">ver pedido</Link>
            </>
          )}
          {error && <span className="text-rose-700"> · {error}</span>}
        </p>
      </div>
      <span className={`font-semibold tabular-nums ${m.tipo === "ingreso" ? "text-emerald-700" : "text-rose-700"}`}>
        {m.tipo === "ingreso" ? "+" : "−"}
        {dinero(m.monto)}
      </span>
      <button
        type="button"
        disabled={enviando}
        aria-label="Borrar movimiento"
        className="rounded-lg p-1.5 text-stone-300 hover:bg-rose-50 hover:text-rose-600"
        onClick={() => {
          if (!confirm("¿Borrar este movimiento?")) return;
          enviar(async () => {
            await api.delete(`/movimientos/${m.id}`);
            alBorrar();
          });
        }}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function FormularioMovimiento({ hoy, alGuardar }: { hoy: string; alGuardar: () => void }) {
  const { enviando, error, ok, enviar } = useEnvio();
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [descripcion, setDescripcion] = useState("");
  const categorias = tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;

  function guardar(e: FormEvent) {
    e.preventDefault();
    enviar(async () => {
      await api.post("/movimientos", { tipo, monto, fecha, categoria, descripcion });
      setMonto("");
      setDescripcion("");
      alGuardar();
      return `${tipo === "gasto" ? "Gasto" : "Ingreso"} registrado.`;
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      {error && <Aviso>{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1" role="radiogroup" aria-label="Tipo de movimiento">
        {(["gasto", "ingreso"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => {
              setTipo(t);
              setCategoria((t === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO)[0]);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              tipo === t ? (t === "gasto" ? "bg-white text-rose-700 shadow-sm" : "bg-white text-emerald-700 shadow-sm") : "text-stone-500"
            }`}
          >
            {t === "gasto" ? "− Gasto" : "+ Ingreso"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="etiqueta">Monto</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input name="monto" value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" required className="campo pl-7" placeholder="0" />
          </div>
        </label>
        <label className="block">
          <span className="etiqueta">Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="etiqueta">Categoría</span>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo">
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="etiqueta">Detalle</span>
        <input name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="campo" placeholder={tipo === "gasto" ? "Ej: 20 m de lienzo crudo" : "Ej: venta en feria"} />
      </label>
      <Boton cargando={enviando} className="boton-primario w-full">Guardar {tipo}</Boton>
      <p className="ayuda text-center">Los pagos de pedidos se registran solos desde cada pedido.</p>
    </form>
  );
}
