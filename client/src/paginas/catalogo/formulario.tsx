import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import type { Producto } from "../../lib/tipos";
import { Aviso, Encabezado, EstadoCarga } from "../../components/ui";
import { Boton } from "../../components/botones";

export function NuevoProducto() {
  useTitulo("Nuevo producto");
  return (
    <>
      <Encabezado titulo="Nuevo producto" volver="/catalogo" />
      <FormularioProducto />
    </>
  );
}

export function EditarProducto() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos, error } = useDatos<Producto>(`/productos/${id}`);
  const borrado = useEnvio();
  useTitulo("Editar producto");
  if (!datos) return <EstadoCarga error={error} />;

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
      <FormularioProducto producto={datos} />
      <div className="mt-8 flex flex-col items-center gap-2">
        {borrado.error && <Aviso>{borrado.error}</Aviso>}
        <Boton type="button" onClick={borrar} cargando={borrado.enviando} textoCargando="Borrando…" className="boton-peligro">
          <Trash2 className="size-4" /> Borrar producto
        </Boton>
      </div>
    </>
  );
}

type FilaMedida = { clave: number; id?: string; medida: string; precio: string };

let siguiente = 1;
const medidaVacia = (): FilaMedida => ({ clave: siguiente++, medida: "", precio: "" });

function FormularioProducto({ producto }: { producto?: Producto }) {
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
      medidas: medidas.map((m) => ({ id: m.id, medida: m.medida, precio: m.precio })),
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
        <h2 className="font-semibold text-stone-900">Medidas y precios</h2>
        <ul className="space-y-3">
          {medidas.map((m) => (
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
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setMedidas((prev) => [...prev, medidaVacia()])} className="boton-secundario w-full border-dashed">
          <Plus className="size-4" /> Agregar medida
        </button>
      </section>

      <div className="flex justify-end">
        <Boton cargando={enviando} className="boton-primario w-full sm:w-auto">{producto ? "Guardar cambios" : "Crear producto"}</Boton>
      </div>
    </form>
  );
}
