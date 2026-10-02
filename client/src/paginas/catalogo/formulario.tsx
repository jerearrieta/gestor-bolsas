import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { useMarco } from "../../components/marco";
import { costoBolsa, margenReal, precioSugerido, redondearPrecio } from "../../lib/calculo";
import { dinero, numero } from "../../lib/formato";
import type { Producto } from "../../lib/tipos";
import { Aviso, Encabezado, EstadoCarga } from "../../components/ui";
import { Boton } from "../../components/botones";

export function NuevoProducto() {
  useTitulo("Nuevo producto");
  const { ajustes } = useMarco();
  if (!ajustes) return null;
  return (
    <>
      <Encabezado titulo="Nuevo producto" volver="/catalogo" />
      <FormularioProducto precioMetro={ajustes.precio_metro_lienzo} margen={ajustes.margen_objetivo} />
    </>
  );
}

export function EditarProducto() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { ajustes } = useMarco();
  const { datos, error } = useDatos<Producto>(`/productos/${id}`);
  const borrado = useEnvio();
  useTitulo("Editar producto");
  if (!datos || !ajustes) return <EstadoCarga error={error} />;

  function borrar() {
    if (!confirm(`¿Borrar "${datos!.nombre}"? Los pedidos ya cargados no se modifican. Si sólo dejaste de venderlo, mejor desmarcá "Producto activo".`)) return;
    borrado.enviar(async () => {
      await api.delete(`/productos/${id}`);
      navegar("/catalogo", { replace: true });
    });
  }

  return (
    <>
      <Encabezado titulo="Editar producto" subtitulo={datos.nombre} volver="/catalogo" />
      <FormularioProducto producto={datos} precioMetro={ajustes.precio_metro_lienzo} margen={ajustes.margen_objetivo} />
      <div className="mt-8 flex flex-col items-center gap-2">
        {borrado.error && <Aviso>{borrado.error}</Aviso>}
        <Boton type="button" onClick={borrar} cargando={borrado.enviando} textoCargando="Borrando…" className="boton-peligro">
          <Trash2 className="size-4" /> Borrar producto
        </Boton>
      </div>
    </>
  );
}

function n(v: string) {
  const x = Number(v.replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

function FormularioProducto({ producto, precioMetro, margen }: { producto?: Producto; precioMetro: number; margen: number }) {
  const navegar = useNavigate();
  const { enviando, error, enviar } = useEnvio();
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(String(producto?.precio ?? ""));
  const [metros, setMetros] = useState(String(producto?.metros_lienzo ?? ""));
  const [otros, setOtros] = useState(String(producto?.otros_costos ?? ""));
  const [activo, setActivo] = useState(producto?.activo ?? true);

  const costo = costoBolsa(precioMetro, n(metros), n(otros));
  const sugerido = redondearPrecio(precioSugerido(costo, margen));
  const margenActual = margenReal(n(precio), costo);

  function guardar(e: FormEvent) {
    e.preventDefault();
    const cuerpo = { nombre, descripcion, precio, metros_lienzo: metros, otros_costos: otros, activo };
    enviar(async () => {
      if (producto) await api.put(`/productos/${producto.id}`, cuerpo);
      else await api.post("/productos", cuerpo);
      navegar("/catalogo", { replace: true });
    });
  }

  return (
    <form onSubmit={guardar} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="tarjeta space-y-4 p-4 sm:p-6">
        {error && <Aviso>{error}</Aviso>}
        <div>
          <label htmlFor="nombre" className="etiqueta">Nombre *</label>
          <input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo" placeholder="Ej: Tote bag 35x40 estampada" />
        </div>
        <div>
          <label htmlFor="descripcion" className="etiqueta">Descripción</label>
          <textarea id="descripcion" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="campo" placeholder="Medidas, tipo de lienzo, colores…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="metros_lienzo" className="etiqueta">Metros de lienzo por bolsa</label>
            <input id="metros_lienzo" inputMode="decimal" value={metros} onChange={(e) => setMetros(e.target.value)} className="campo" placeholder="Ej: 0,5" />
          </div>
          <div>
            <label htmlFor="otros_costos" className="etiqueta">Otros costos por bolsa ($)</label>
            <input id="otros_costos" inputMode="decimal" value={otros} onChange={(e) => setOtros(e.target.value)} className="campo" placeholder="Hilo, manijas, estampado…" />
          </div>
        </div>
        <div>
          <label htmlFor="precio" className="etiqueta">Precio de venta ($) *</label>
          <input id="precio" required inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} className="campo text-lg font-semibold" />
        </div>
        <label className="flex items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="size-5 accent-marca-600" />
          Producto activo (aparece al cargar pedidos)
        </label>
        <div className="flex justify-end">
          <Boton cargando={enviando} className="boton-primario w-full sm:w-auto">{producto ? "Guardar cambios" : "Crear producto"}</Boton>
        </div>
      </div>

      <aside className="tarjeta h-fit space-y-3 bg-marca-50/60 p-4 sm:p-5">
        <h2 className="font-semibold text-stone-900">Costo y precio sugerido</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2"><dt className="text-stone-600">Lienzo ({numero(n(metros), 3)} m × {dinero(precioMetro)})</dt><dd className="tabular-nums">{dinero(precioMetro * n(metros))}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-stone-600">Otros costos</dt><dd className="tabular-nums">{dinero(n(otros))}</dd></div>
          <div className="flex justify-between gap-2 border-t border-marca-200 pt-2 font-semibold"><dt>Costo por bolsa</dt><dd className="tabular-nums">{dinero(costo)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-stone-600">Precio sugerido ({numero(margen)}% de margen)</dt><dd className="font-semibold tabular-nums text-marca-700">{dinero(sugerido)}</dd></div>
          {n(precio) > 0 && costo > 0 && (
            <div className="flex justify-between gap-2"><dt className="text-stone-600">Margen con tu precio</dt><dd className={`font-semibold tabular-nums ${margenActual < margen ? "text-rose-700" : "text-emerald-700"}`}>{numero(margenActual, 1)}%</dd></div>
          )}
        </dl>
        {sugerido > 0 && sugerido !== n(precio) && (
          <button type="button" onClick={() => setPrecio(String(sugerido))} className="boton-secundario w-full">
            Usar precio sugerido ({dinero(sugerido)})
          </button>
        )}
        {precioMetro === 0 && <p className="text-xs text-stone-500">Tip: cargá cuánto te cuesta el metro de lienzo en la Calculadora para ver el costo real.</p>}
      </aside>
    </form>
  );
}
