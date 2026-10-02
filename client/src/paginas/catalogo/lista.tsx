import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Calculator, Check, Loader2, Pencil, Plus, Tag, TrendingUp } from "lucide-react";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { dinero, numero } from "../../lib/formato";
import type { DatosCatalogo } from "../../lib/catalogo";
import type { Producto } from "../../lib/tipos";
import { Aviso, Encabezado, EstadoCarga, Vacio } from "../../components/ui";
import { Boton } from "../../components/botones";

export function Catalogo() {
  useTitulo("Catálogo y precios");
  const { datos, error, recargar } = useDatos<DatosCatalogo>("/productos");

  return (
    <>
      <Encabezado
        titulo="Catálogo y precios"
        subtitulo="Cambiá un precio y tocá ✓ para guardarlo."
        acciones={
          <>
            <Link to="/catalogo/calculadora" className="boton-secundario">
              <Calculator className="size-4" /> Calculadora
            </Link>
            <Link to="/catalogo/nuevo" className="boton-primario">
              <Plus className="size-4" /> Nuevo producto
            </Link>
          </>
        }
      />
      {!datos ? (
        <EstadoCarga error={error} />
      ) : datos.productos.length === 0 ? (
        <Vacio
          icono={<Tag className="size-10" />}
          titulo="Tu catálogo está vacío"
          texto="Cargá tus modelos de bolsas con su precio. Después los elegís con un toque al armar un pedido."
          accion={<Link to="/catalogo/nuevo" className="boton-primario"><Plus className="size-4" /> Cargar el primero</Link>}
        />
      ) : (
        <>
          <AumentoMasivo alTerminar={recargar} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {datos.productos.map((p) => (
              <TarjetaProducto key={`${p.id}-${p.precio}`} producto={p} alGuardar={recargar} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function TarjetaProducto({ producto: p, alGuardar }: { producto: Producto; alGuardar: () => void }) {
  const [precio, setPrecio] = useState(String(p.precio));
  const { enviando, error, enviar } = useEnvio();

  function guardar(e: FormEvent) {
    e.preventDefault();
    enviar(async () => {
      await api.patch(`/productos/${p.id}/precio`, { precio });
      alGuardar();
    });
  }

  return (
    <li className={`tarjeta p-4 ${p.activo ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-stone-900">{p.nombre}</p>
          {p.descripcion && <p className="line-clamp-2 text-xs text-stone-500">{p.descripcion}</p>}
          {!p.activo && <p className="mt-1 text-xs font-medium text-stone-500">Inactivo</p>}
        </div>
        <Link to={`/catalogo/${p.id}`} aria-label={`Editar ${p.nombre}`} className="-mr-1 -mt-1 rounded-lg p-2 text-stone-500 hover:bg-stone-100">
          <Pencil className="size-4" />
        </Link>
      </div>
      <form onSubmit={guardar} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            inputMode="decimal"
            aria-label={`Precio de ${p.nombre}`}
            className="campo pl-7 text-lg font-semibold tabular-nums"
          />
        </div>
        <button type="submit" disabled={enviando || precio === String(p.precio)} className="boton-primario px-3" aria-label="Guardar precio">
          {enviando ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
      {p.costo > 0 && (
        <p className="mt-2 text-xs text-stone-500">
          Costo {dinero(p.costo)} · margen{" "}
          <span className={`font-semibold ${p.margen_bajo ? "text-rose-700" : "text-emerald-700"}`}>{numero(p.margen_real, 1)}%</span>
          {p.margen_bajo && " (bajo tu objetivo)"}
        </p>
      )}
    </li>
  );
}

function AumentoMasivo({ alTerminar }: { alTerminar: () => void }) {
  const [porcentaje, setPorcentaje] = useState("");
  const [redondeo, setRedondeo] = useState("50");
  const { enviando, error, ok, enviar } = useEnvio();

  function aplicar(e: FormEvent) {
    e.preventDefault();
    if (!confirm("¿Aplicar el cambio a todos los productos activos?")) return;
    enviar(async () => {
      const { actualizados } = await api.post<{ actualizados: number }>("/productos/aumento", {
        porcentaje: porcentaje.replace(",", "."),
        redondeo,
      });
      const n = Number(porcentaje.replace(",", "."));
      setPorcentaje("");
      alTerminar();
      return `Listo: ${actualizados} productos actualizados (${n > 0 ? "+" : ""}${n}%).`;
    });
  }

  return (
    <details className="tarjeta group mb-4 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-stone-800 hover:bg-stone-50">
        <TrendingUp className="size-4 text-marca-600" /> Actualizar todos los precios a la vez
        <span className="ml-auto text-xs font-normal text-stone-500 group-open:hidden">Ej: +10% por inflación</span>
      </summary>
      <form onSubmit={aplicar} className="space-y-3 border-t border-stone-100 px-4 py-4">
        {error && <Aviso>{error}</Aviso>}
        {ok && <Aviso tipo="ok">{ok}</Aviso>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="porcentaje" className="etiqueta">Porcentaje</label>
            <div className="relative">
              <input id="porcentaje" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} inputMode="decimal" required placeholder="10" className="campo pr-8" />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">%</span>
            </div>
          </div>
          <div>
            <label htmlFor="redondeo" className="etiqueta">Redondear a</label>
            <select id="redondeo" value={redondeo} onChange={(e) => setRedondeo(e.target.value)} className="campo">
              <option value="0">Sin redondeo</option>
              <option value="10">$10</option>
              <option value="50">$50</option>
              <option value="100">$100</option>
              <option value="500">$500</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Boton cargando={enviando} textoCargando="Aplicando…" className="boton-primario w-full">Aplicar</Boton>
          </div>
        </div>
        <p className="ayuda">Usá un número negativo para bajar precios (ej: -5). Sólo afecta a productos activos; los pedidos ya cargados no cambian.</p>
      </form>
    </details>
  );
}
