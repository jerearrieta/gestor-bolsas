import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { Boton } from "../../components/botones";
import { Aviso, Encabezado, EstadoCarga } from "../../components/ui";
import { dinero } from "../../lib/formato";
import { ESTADOS, nombreConMedida, type EstadoPedido } from "../../lib/tipos";

type ClienteOpcion = { id: string; nombre: string; telefono: string | null; direccion: string | null; localidad: string | null };
type ProductoOpcion = { id: string; nombre: string; medidas: { id: string; medida: string; precio: number }[] };
type Item = { clave: number; producto_id: string; medida_id: string; descripcion: string; cantidad: string; precio_unitario: string };

type PedidoInicial = {
  id: string;
  cliente_id: string | null;
  estado: EstadoPedido;
  fecha: string;
  fecha_entrega: string | null;
  direccion_envio: string | null;
  costo_envio: number;
  descuento: number;
  notas: string | null;
  items: { producto_id: string | null; medida_id: string | null; descripcion: string; cantidad: number; precio_unitario: number }[];
};

function n(v: string) {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

type Opciones = { clientes: ClienteOpcion[]; productos: ProductoOpcion[]; hoy: string };

export function NuevoPedido() {
  useTitulo("Nuevo pedido");
  const [params] = useSearchParams();
  const { datos, error } = useDatos<Opciones>("/pedidos/opciones");
  if (!datos) return <EstadoCarga error={error} />;
  return (
    <>
      <Encabezado titulo="Nuevo pedido" volver="/pedidos" />
      <FormularioPedido {...datos} clienteInicial={params.get("cliente") ?? undefined} />
    </>
  );
}

export function EditarPedido() {
  const { id } = useParams();
  useTitulo("Editar pedido");
  const opciones = useDatos<Opciones>("/pedidos/opciones");
  const pedido = useDatos<{ pedido: PedidoInicial & { numero: number }; items: PedidoInicial["items"] }>(`/pedidos/${id}`);
  if (!opciones.datos || !pedido.datos) return <EstadoCarga error={opciones.error ?? pedido.error} />;
  const inicial = { ...pedido.datos.pedido, items: pedido.datos.items };
  return (
    <>
      <Encabezado titulo={`Editar pedido #${inicial.numero}`} volver={`/pedidos/${id}`} />
      <FormularioPedido {...opciones.datos} pedido={inicial} />
    </>
  );
}

let siguiente = 1;
const itemVacio = (): Item => ({ clave: siguiente++, producto_id: "", medida_id: "", descripcion: "", cantidad: "1", precio_unitario: "" });

function FormularioPedido({
  clientes,
  productos,
  pedido,
  clienteInicial,
  hoy,
}: {
  clientes: ClienteOpcion[];
  productos: ProductoOpcion[];
  pedido?: PedidoInicial;
  clienteInicial?: string;
  hoy: string;
}) {
  const navegar = useNavigate();
  const { enviando, error, enviar, setError } = useEnvio();
  const [clienteId, setClienteId] = useState(pedido?.cliente_id ?? clienteInicial ?? (clientes.length ? "" : "nuevo"));
  const [direccion, setDireccion] = useState(() => {
    if (pedido) return pedido.direccion_envio ?? "";
    const c = clientes.find((x) => x.id === clienteInicial);
    return c ? [c.direccion, c.localidad].filter(Boolean).join(", ") : "";
  });
  const [items, setItems] = useState<Item[]>(() =>
    pedido?.items.length
      ? pedido.items.map((i) => ({
          clave: siguiente++,
          producto_id: i.producto_id ?? "",
          medida_id: i.medida_id ?? "",
          descripcion: i.descripcion,
          cantidad: String(i.cantidad),
          precio_unitario: String(i.precio_unitario),
        }))
      : [itemVacio()],
  );
  const [envio, setEnvio] = useState(String(pedido?.costo_envio ?? ""));
  const [descuento, setDescuento] = useState(String(pedido?.descuento ?? ""));

  const subtotal = items.reduce((s, i) => s + n(i.cantidad) * n(i.precio_unitario), 0);
  const total = Math.max(subtotal + n(envio) - n(descuento), 0);

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validos = items.filter((i) => i.descripcion.trim() && n(i.cantidad) > 0);
    if (validos.length === 0) {
      setError("Agregá al menos un producto con su descripción y cantidad.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const f = new FormData(e.currentTarget);
    const cuerpo = {
      cliente_id: clienteId && clienteId !== "nuevo" ? clienteId : null,
      nuevo_cliente: clienteId === "nuevo" ? { nombre: f.get("nuevo_nombre"), telefono: f.get("nuevo_telefono") } : null,
      estado: f.get("estado"),
      fecha: f.get("fecha"),
      fecha_entrega: f.get("fecha_entrega"),
      direccion_envio: direccion,
      costo_envio: envio,
      descuento,
      notas: f.get("notas"),
      sena: f.get("sena") ?? 0,
      items: validos.map((i) => ({
        producto_id: i.producto_id || null,
        medida_id: i.medida_id || null,
        descripcion: i.descripcion,
        cantidad: n(i.cantidad),
        precio_unitario: i.precio_unitario,
      })),
    };
    enviar(async () => {
      const { id } = pedido ? await api.put<{ id: string }>(`/pedidos/${pedido.id}`, cuerpo) : await api.post<{ id: string }>("/pedidos", cuerpo);
      navegar(`/pedidos/${id}`, { replace: true });
    }).then((ok) => !ok && window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function cambiarItem(clave: number, cambios: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)));
  }

  function elegirMedida(clave: number, medidaId: string) {
    for (const p of productos) {
      const m = p.medidas.find((x) => x.id === medidaId);
      if (m) {
        cambiarItem(clave, { producto_id: p.id, medida_id: m.id, descripcion: nombreConMedida(p.nombre, m.medida), precio_unitario: String(m.precio) });
        return;
      }
    }
    cambiarItem(clave, { producto_id: "", medida_id: "" });
  }

  function elegirCliente(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id);
    if (c && !direccion) setDireccion([c.direccion, c.localidad].filter(Boolean).join(", "));
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      {error && <Aviso>{error}</Aviso>}

      {/* Cliente */}
      <section className="tarjeta space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-stone-900">Cliente</h2>
        <div>
          <label htmlFor="cliente_id" className="etiqueta">¿Para quién es?</label>
          <select id="cliente_id" value={clienteId} onChange={(e) => elegirCliente(e.target.value)} className="campo">
            <option value="">Sin cliente asignado</option>
            <option value="nuevo">➕ Cliente nuevo…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.telefono ? ` · ${c.telefono}` : ""}
              </option>
            ))}
          </select>
        </div>
        {clienteId === "nuevo" && (
          <div className="grid gap-3 rounded-xl bg-marca-50/70 p-3 sm:grid-cols-2">
            <div>
              <label htmlFor="nuevo_nombre" className="etiqueta">Nombre *</label>
              <input id="nuevo_nombre" name="nuevo_nombre" className="campo" placeholder="Ej: Ana Gómez" required />
            </div>
            <div>
              <label htmlFor="nuevo_telefono" className="etiqueta">WhatsApp</label>
              <input id="nuevo_telefono" name="nuevo_telefono" type="tel" inputMode="tel" className="campo" placeholder="11 2345 6789" />
            </div>
            <p className="ayuda sm:col-span-2">Se guarda en Clientes con la dirección de envío de abajo.</p>
          </div>
        )}
        <div>
          <label htmlFor="direccion_envio" className="etiqueta">Dirección de envío</label>
          <input id="direccion_envio" name="direccion_envio" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="campo" placeholder="Vacío si retira en persona" />
        </div>
      </section>

      {/* Productos */}
      <section className="tarjeta space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-stone-900">Productos</h2>
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={item.clave} className="rounded-xl border border-stone-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Ítem {idx + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems((p) => p.filter((i) => i.clave !== item.clave))} className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Quitar ítem">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1.2fr_1.5fr]">
                <select value={item.medida_id} onChange={(e) => elegirMedida(item.clave, e.target.value)} className="campo" aria-label="Producto del catálogo">
                  <option value="">Elegir del catálogo…</option>
                  {productos.map((p) => (
                    <optgroup key={p.id} label={p.nombre}>
                      {p.medidas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {nombreConMedida(p.nombre, m.medida)} · {dinero(m.precio)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input value={item.descripcion} onChange={(e) => cambiarItem(item.clave, { descripcion: e.target.value })} className="campo" placeholder="Descripción (color, estampa, medida…)" aria-label="Descripción" />
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
                <label className="block">
                  <span className="sr-only">Cantidad</span>
                  <div className="relative">
                    <input value={item.cantidad} onChange={(e) => cambiarItem(item.clave, { cantidad: e.target.value })} inputMode="numeric" className="campo pr-10" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">u.</span>
                  </div>
                </label>
                <label className="block">
                  <span className="sr-only">Precio unitario</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                    <input value={item.precio_unitario} onChange={(e) => cambiarItem(item.clave, { precio_unitario: e.target.value })} inputMode="decimal" className="campo pl-7" placeholder="Precio c/u" />
                  </div>
                </label>
                <span className="min-w-20 text-right font-semibold tabular-nums">{dinero(n(item.cantidad) * n(item.precio_unitario))}</span>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setItems((p) => [...p, itemVacio()])} className="boton-secundario w-full border-dashed">
          <Plus className="size-4" /> Agregar otro producto
        </button>
      </section>

      {/* Detalles */}
      <section className="tarjeta space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-stone-900">Detalles</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="fecha" className="etiqueta">Fecha del pedido</label>
            <input id="fecha" name="fecha" type="date" defaultValue={pedido?.fecha ?? hoy} className="campo" />
          </div>
          <div>
            <label htmlFor="fecha_entrega" className="etiqueta">Entregar el</label>
            <input id="fecha_entrega" name="fecha_entrega" type="date" defaultValue={pedido?.fecha_entrega ?? ""} className="campo" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="estado" className="etiqueta">Estado</label>
            <select id="estado" name="estado" defaultValue={pedido?.estado ?? "pendiente"} className="campo">
              {ESTADOS.map((e) => (
                <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="costo_envio" className="etiqueta">Costo de envío</label>
            <input id="costo_envio" name="costo_envio" value={envio} onChange={(e) => setEnvio(e.target.value)} inputMode="decimal" className="campo" placeholder="0" />
          </div>
          <div>
            <label htmlFor="descuento" className="etiqueta">Descuento</label>
            <input id="descuento" name="descuento" value={descuento} onChange={(e) => setDescuento(e.target.value)} inputMode="decimal" className="campo" placeholder="0" />
          </div>
          {!pedido && (
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="sena" className="etiqueta">Seña recibida</label>
              <input id="sena" name="sena" inputMode="decimal" className="campo" placeholder="0" />
            </div>
          )}
        </div>
        <div>
          <label htmlFor="notas" className="etiqueta">Notas</label>
          <textarea id="notas" name="notas" rows={2} defaultValue={pedido?.notas ?? ""} className="campo" placeholder="Colores, diseño del estampado, forma de pago…" />
        </div>
      </section>

      {/* Total y guardar: fijo abajo en el celular */}
      <div className="sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
        <div className="pl-1">
          <p className="text-xs text-stone-500">Total del pedido</p>
          <p className="text-xl font-bold tabular-nums">{dinero(total)}</p>
        </div>
        <Boton cargando={enviando} className="boton-primario px-6">{pedido ? "Guardar cambios" : "Crear pedido"}</Boton>
      </div>
    </form>
  );
}
