import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { useMarco } from "../../components/marco";
import { dinero, numero } from "../../lib/formato";
import type { DatosCatalogo } from "../../lib/catalogo";
import { nombreConMedida, type Medida, type Producto } from "../../lib/tipos";
import { Aviso, Encabezado, EstadoCarga, Vacio } from "../../components/ui";
import { Boton } from "../../components/botones";
import { CalculadoraRapida } from "./rapida";

export function Calculadora() {
  useTitulo("Calculadora de costos");
  const { recargarAjustes } = useMarco();
  const { datos, error, recargar } = useDatos<DatosCatalogo>("/productos?activos=1");
  if (!datos) return <EstadoCarga error={error} />;
  const { precio_metro_lienzo: precioMetro, margen_objetivo: margen } = datos;

  return (
    <>
      <Encabezado
        titulo="Calculadora de costos"
        subtitulo="Poné cuánto te cuesta el metro de lienzo y te decimos a cuánto vender cada bolsa."
        volver="/catalogo"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <CostosBase
          precioMetro={precioMetro}
          margen={margen}
          alGuardar={() => {
            recargar();
            recargarAjustes();
          }}
        />
        <CalculadoraRapida key={`r-${precioMetro}-${margen}`} precioMetro={precioMetro} margen={margen} />
      </div>

      <section className="mt-6">
        <h2 className="mb-1 font-semibold text-stone-900">3. Precios sugeridos de tu catálogo</h2>
        <p className="mb-3 text-sm text-stone-500">
          Con el lienzo a {dinero(precioMetro)} el metro y {numero(margen)}% de margen. Tocá “Aplicar” para usar el precio sugerido.
        </p>
        {datos.productos.length === 0 ? (
          <Vacio titulo="No hay productos activos" accion={<Link to="/catalogo/nuevo" className="boton-primario">Cargar producto</Link>} />
        ) : (
          <ul className="tarjeta divide-y divide-stone-100">
            {datos.productos.flatMap((p) =>
              p.medidas.map((m) => <FilaSugerido key={m.id} producto={p} medida={m} margen={margen} alAplicar={recargar} />),
            )}
          </ul>
        )}
      </section>
    </>
  );
}

function CostosBase({ precioMetro, margen, alGuardar }: { precioMetro: number; margen: number; alGuardar: () => void }) {
  const [metro, setMetro] = useState(precioMetro ? String(precioMetro) : "");
  const [m, setM] = useState(String(margen));
  const { enviando, error, ok, enviar } = useEnvio();

  function guardar(e: FormEvent) {
    e.preventDefault();
    enviar(async () => {
      if (!metro.trim()) throw new Error("Ingresá cuánto te cuesta el metro de lienzo.");
      await api.put("/ajustes", { precio_metro_lienzo: metro, margen_objetivo: m });
      alGuardar();
      return "Guardado. Los precios sugeridos se recalcularon.";
    });
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-4 p-4 sm:p-5">
      <h2 className="font-semibold text-stone-900">1. Tus costos base</h2>
      {error && <Aviso>{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="precio_metro_lienzo" className="etiqueta">Precio del metro de lienzo</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input id="precio_metro_lienzo" inputMode="decimal" value={metro} onChange={(e) => setMetro(e.target.value)} placeholder="0" className="campo pl-7 text-lg font-semibold" />
          </div>
        </div>
        <div>
          <label htmlFor="margen_objetivo" className="etiqueta">Margen que querés ganar</label>
          <div className="relative">
            <input id="margen_objetivo" inputMode="decimal" value={m} onChange={(e) => setM(e.target.value)} className="campo pr-8 text-lg font-semibold" />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">%</span>
          </div>
        </div>
      </div>
      <p className="ayuda">El margen es la parte del precio que te queda de ganancia. Con 50%, de cada $1.000 que cobrás, $500 son ganancia.</p>
      <Boton cargando={enviando} className="boton-primario w-full">Guardar y recalcular</Boton>
    </form>
  );
}

function FilaSugerido({ producto, medida: p, margen, alAplicar }: { producto: Producto; medida: Medida; margen: number; alAplicar: () => void }) {
  const { enviando, error, enviar } = useEnvio();
  const sinDatos = p.costo === 0;
  const alDia = !sinDatos && p.precio_sugerido === p.precio;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
      <div className="min-w-40 flex-1">
        <Link to={`/catalogo/${producto.id}`} className="font-medium text-stone-900 hover:underline">{nombreConMedida(producto.nombre, p.medida)}</Link>
        <p className="text-xs text-stone-500">
          {sinDatos ? "Falta cargar metros de lienzo u otros costos" : `${numero(p.metros_lienzo, 3)} m + ${dinero(p.otros_costos)} = costo ${dinero(p.costo)}`}
        </p>
        {error && <p className="text-xs text-rose-700">{error}</p>}
      </div>
      <div className="text-right text-sm">
        <p className="text-xs text-stone-500">Actual</p>
        <p className="font-semibold tabular-nums">{dinero(p.precio)}</p>
        {!sinDatos && <p className={`text-xs font-medium ${p.margen_real < margen ? "text-rose-700" : "text-emerald-700"}`}>{numero(p.margen_real, 1)}%</p>}
      </div>
      <div className="text-right text-sm">
        <p className="text-xs text-stone-500">Sugerido</p>
        <p className="font-semibold tabular-nums text-marca-700">{sinDatos ? "—" : dinero(p.precio_sugerido)}</p>
      </div>
      <Boton
        type="button"
        cargando={enviando}
        textoCargando="…"
        disabled={sinDatos || alDia}
        className="boton-secundario min-h-9 px-3 py-1.5"
        onClick={() =>
          enviar(async () => {
            await api.patch(`/productos/medidas/${p.id}/precio`, { precio: p.precio_sugerido });
            alAplicar();
          })
        }
      >
        {alDia ? "Al día" : "Aplicar"}
      </Boton>
    </li>
  );
}
