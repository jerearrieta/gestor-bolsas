import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
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

type FilaMedida = { clave: number; id?: string; medida: string; precio: string; metros: string; otros: string };

let siguiente = 1;
const medidaVacia = (): FilaMedida => ({ clave: siguiente++, medida: "", precio: "", metros: "", otros: "" });

function FormularioProducto({ producto, precioMetro, margen }: { producto?: Producto; precioMetro: number; margen: number }) {
  const navegar = useNavigate();
  const { enviando, error, enviar } = useEnvio();
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [medidas, setMedidas] = useState<FilaMedida[]>(() =>
    producto?.medidas.length
      ? producto.medidas.map((m) => ({
          clave: siguiente++,
          id: m.id,
          medida: m.medida,
          precio: String(m.precio),
          metros: m.metros_lienzo ? String(m.metros_lienzo) : "",
          otros: m.otros_costos ? String(m.otros_costos) : "",
        }))
      : [medidaVacia()],
  );

  function cambiar(clave: number, cambios: Partial<FilaMedida>) {
    setMedidas((prev) => prev.map((m) => (m.clave === clave ? { ...m, ...cambios } : m)));
  }

  function guardar(e: FormEvent) {
    e.preventDefault();
    const cuerpo = {
      nombre,
      descripcion,
      activo,
      medidas: medidas.map((m) => ({ id: m.id, medida: m.medida, precio: m.precio, metros_lienzo: m.metros, otros_costos: m.otros })),
    };
    enviar(async () => {
      if (producto) await api.put(`/productos/${producto.id}`, cuerpo);
      else await api.post("/productos", cuerpo);
      navegar("/catalogo", { replace: true });
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="tarjeta space-y-4 p-4 sm:p-6">
        {error && <Aviso>{error}</Aviso>}
        <div>
          <label htmlFor="nombre" className="etiqueta">Producto *</label>
          <input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo" placeholder="Ej: Marinera, Totebag, Mochilita…" />
        </div>
        <div>
          <label htmlFor="descripcion" className="etiqueta">Descripción</label>
          <textarea id="descripcion" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="campo" placeholder="Tipo de lienzo, colores, terminaciones…" />
        </div>
        <label className="flex items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="size-5 accent-marca-600" />
          Producto activo (aparece al cargar pedidos)
        </label>
      </div>

      <section className="tarjeta space-y-3 p-4 sm:p-6">
        <div>
          <h2 className="font-semibold text-stone-900">Medidas y precios</h2>
          <p className="text-sm text-stone-500">
            Los metros de lienzo y otros costos son opcionales: sirven para calcular el costo y el precio sugerido ({numero(margen)}% de margen).
          </p>
        </div>
        <ul className="space-y-3">
          {medidas.map((m) => {
            const costo = costoBolsa(precioMetro, n(m.metros), n(m.otros));
            const sugerido = redondearPrecio(precioSugerido(costo, margen));
            const margenActual = margenReal(n(m.precio), costo);
            return (
              <li key={m.clave} className="rounded-xl border border-stone-200 p-3">
                <div className="grid grid-cols-[1fr_1.2fr_auto] items-end gap-2">
                  <label className="block">
                    <span className="etiqueta">Medida</span>
                    <input value={m.medida} onChange={(e) => cambiar(m.clave, { medida: e.target.value })} className="campo" placeholder="Ej: 20x30" />
                  </label>
                  <label className="block">
                    <span className="etiqueta">Precio ($) *</span>
                    <input required inputMode="decimal" value={m.precio} onChange={(e) => cambiar(m.clave, { precio: e.target.value })} className="campo font-semibold" />
                  </label>
                  <button
                    type="button"
                    disabled={medidas.length === 1}
                    onClick={() => setMedidas((prev) => prev.filter((x) => x.clave !== m.clave))}
                    className="mb-1 rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 disabled:invisible"
                    aria-label={`Quitar medida ${m.medida}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="etiqueta">Metros de lienzo</span>
                    <input inputMode="decimal" value={m.metros} onChange={(e) => cambiar(m.clave, { metros: e.target.value })} className="campo" placeholder="Ej: 0,25" />
                  </label>
                  <label className="block">
                    <span className="etiqueta">Otros costos ($)</span>
                    <input inputMode="decimal" value={m.otros} onChange={(e) => cambiar(m.clave, { otros: e.target.value })} className="campo" placeholder="Hilo, manijas…" />
                  </label>
                </div>
                {costo > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                    <span>Costo {dinero(costo)}</span>
                    <span>Sugerido <strong className="text-marca-700">{dinero(sugerido)}</strong></span>
                    {n(m.precio) > 0 && (
                      <span className={`font-semibold ${margenActual < margen ? "text-rose-700" : "text-emerald-700"}`}>Margen {numero(margenActual, 1)}%</span>
                    )}
                    {sugerido !== n(m.precio) && (
                      <button type="button" onClick={() => cambiar(m.clave, { precio: String(sugerido) })} className="font-semibold text-marca-700 underline">
                        Usar sugerido
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={() => setMedidas((prev) => [...prev, medidaVacia()])} className="boton-secundario w-full border-dashed">
          <Plus className="size-4" /> Agregar medida
        </button>
        {precioMetro === 0 && <p className="text-xs text-stone-500">Tip: cargá cuánto te cuesta el metro de lienzo en la Calculadora para ver el costo real.</p>}
      </section>

      <div className="flex justify-end">
        <Boton cargando={enviando} className="boton-primario w-full sm:w-auto">{producto ? "Guardar cambios" : "Crear producto"}</Boton>
      </div>
    </form>
  );
}
