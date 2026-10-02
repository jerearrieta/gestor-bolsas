import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Ban, CalendarClock, Check, MapPin, MessageCircle, Pencil, Phone, StickyNote, Trash2, User } from "lucide-react";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { dinero, fechaCorta } from "../../lib/formato";
import { FLUJO, infoEstado, type EstadoPedido, type Movimiento, type PedidoItem, type PedidoResumen } from "../../lib/tipos";
import { Aviso, Encabezado, EstadoBadge, EstadoCarga, Tarjeta, TituloSeccion } from "../../components/ui";
import { Boton } from "../../components/botones";

type DatosPedido = { pedido: PedidoResumen; items: PedidoItem[]; pagos: Movimiento[]; whatsapp_listo: string | null; hoy: string };

export function DetallePedido() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos, error, recargar } = useDatos<DatosPedido>(`/pedidos/${id}`);
  const accion = useEnvio();
  useTitulo(datos ? `Pedido #${datos.pedido.numero}` : "Pedido");
  if (!datos) return <EstadoCarga error={error} />;

  const { pedido, items, pagos, whatsapp_listo: wa } = datos;
  const saldo = Number(pedido.saldo);
  const cancelado = pedido.estado === "cancelado";
  const pasoActual = FLUJO.indexOf(pedido.estado);
  const siguiente = pasoActual >= 0 && pasoActual < FLUJO.length - 1 ? FLUJO[pasoActual + 1] : null;

  function cambiarEstado(estado: EstadoPedido, pregunta?: string) {
    if (pregunta && !confirm(pregunta)) return;
    accion.enviar(async () => {
      await api.patch(`/pedidos/${id}/estado`, { estado });
      recargar();
    });
  }

  function borrar() {
    if (!confirm("¿Borrar el pedido definitivamente? Los pagos registrados se mantienen en Finanzas.")) return;
    accion.enviar(async () => {
      await api.delete(`/pedidos/${id}`);
      navegar("/pedidos", { replace: true });
    });
  }

  return (
    <>
      <Encabezado
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            Pedido #{pedido.numero} <EstadoBadge estado={pedido.estado} />
          </span>
        }
        subtitulo={`Cargado el ${fechaCorta(pedido.fecha)}`}
        volver="/pedidos"
        acciones={
          <Link to={`/pedidos/${id}/editar`} className="boton-secundario">
            <Pencil className="size-4" /> Editar
          </Link>
        }
      />

      {accion.error && <div className="mb-4"><Aviso>{accion.error}</Aviso></div>}

      {/* Avance del pedido */}
      {!cancelado && (
        <Tarjeta className="mb-4">
          <ol className="grid grid-cols-4 gap-1">
            {FLUJO.map((e, i) => {
              const hecho = i <= pasoActual;
              return (
                <li key={e} className="flex flex-col items-center gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => cambiarEstado(e)}
                    disabled={accion.enviando}
                    title={`Marcar como ${infoEstado(e).etiqueta}`}
                    className={`grid size-9 place-items-center rounded-full border-2 text-sm font-bold transition ${
                      hecho ? "border-marca-600 bg-marca-600 text-white" : "border-stone-300 bg-white text-stone-400 hover:border-marca-400"
                    }`}
                  >
                    {hecho ? <Check className="size-4" /> : i + 1}
                  </button>
                  <span className={`text-[11px] font-medium leading-tight sm:text-xs ${i === pasoActual ? "text-marca-800" : "text-stone-500"}`}>
                    {infoEstado(e).etiqueta}
                  </span>
                </li>
              );
            })}
          </ol>
          {siguiente && (
            <Boton type="button" onClick={() => cambiarEstado(siguiente)} cargando={accion.enviando} textoCargando="Actualizando…" className="boton-primario mt-4 w-full">
              Pasar a “{infoEstado(siguiente).etiqueta}”
            </Boton>
          )}
        </Tarjeta>
      )}

      {/* WhatsApp */}
      {!cancelado && (
        <div className={`mb-4 rounded-2xl p-4 ${pedido.estado === "listo" ? "border border-green-200 bg-green-50" : "border border-stone-200 bg-white"}`}>
          {wa ? (
            <>
              {pedido.estado === "listo" && <p className="mb-2 text-sm font-medium text-green-900">¡El pedido está listo! Avisale a {pedido.cliente_nombre?.split(" ")[0]}:</p>}
              <a href={wa} target="_blank" rel="noopener noreferrer" className="boton-whatsapp w-full">
                <MessageCircle className="size-5" /> Avisar que el pedido está listo
              </a>
              <p className="ayuda text-center">Abre WhatsApp con el mensaje ya escrito. Podés editarlo antes de enviarlo.</p>
            </>
          ) : (
            <p className="text-sm text-stone-600">
              Para avisar por WhatsApp,{" "}
              {pedido.cliente_id ? (
                <Link to={`/clientes/${pedido.cliente_id}/editar`} className="font-medium text-marca-700 underline">cargale un teléfono al cliente</Link>
              ) : (
                "asigná un cliente con teléfono a este pedido"
              )}
              .
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Tarjeta>
            <TituloSeccion>Productos</TituloSeccion>
            <ul className="divide-y divide-stone-100">
              {items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium text-stone-900">{i.descripcion}</p>
                    <p className="text-xs text-stone-500">{i.cantidad} × {dinero(i.precio_unitario)}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{dinero(i.cantidad * Number(i.precio_unitario))}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-stone-200 pt-3 text-sm">
              <Linea etiqueta="Subtotal" valor={dinero(pedido.subtotal)} />
              {Number(pedido.costo_envio) > 0 && <Linea etiqueta="Envío" valor={dinero(pedido.costo_envio)} />}
              {Number(pedido.descuento) > 0 && <Linea etiqueta="Descuento" valor={`− ${dinero(pedido.descuento)}`} />}
              <Linea etiqueta="Total" valor={dinero(pedido.total)} fuerte />
              <Linea etiqueta="Pagado" valor={dinero(pedido.pagado)} />
              <Linea etiqueta={saldo > 0 ? "Falta cobrar" : "Saldo"} valor={dinero(Math.max(saldo, 0))} fuerte clase={saldo > 0 ? "text-rose-700" : "text-emerald-700"} />
            </dl>
          </Tarjeta>

          <Tarjeta>
            <TituloSeccion>Entrega</TituloSeccion>
            <dl className="space-y-3 text-sm">
              <Fila icono={<User className="size-4" />}>
                {pedido.cliente_id ? (
                  <Link to={`/clientes/${pedido.cliente_id}`} className="font-medium text-marca-700 hover:underline">{pedido.cliente_nombre}</Link>
                ) : (
                  <span className="text-stone-400">Sin cliente</span>
                )}
              </Fila>
              {pedido.cliente_telefono && <Fila icono={<Phone className="size-4" />}>{pedido.cliente_telefono}</Fila>}
              <Fila icono={<MapPin className="size-4" />}>{pedido.direccion_envio ?? <span className="text-stone-400">Retira en persona</span>}</Fila>
              <Fila icono={<CalendarClock className="size-4" />}>
                {pedido.fecha_entrega ? `Entregar el ${fechaCorta(pedido.fecha_entrega)}` : <span className="text-stone-400">Sin fecha de entrega</span>}
              </Fila>
              {pedido.notas && <Fila icono={<StickyNote className="size-4" />}>{pedido.notas}</Fila>}
            </dl>
          </Tarjeta>
        </div>

        <div className="space-y-4">
          <Tarjeta>
            <TituloSeccion>Pagos</TituloSeccion>
            {pagos.length > 0 && (
              <ul className="mb-4 divide-y divide-stone-100 text-sm">
                {pagos.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2 py-2">
                    <span>
                      <span className="text-stone-800">{m.categoria}</span>
                      <span className="block text-xs text-stone-500">
                        {fechaCorta(m.fecha)}
                        {m.descripcion ? ` · ${m.descripcion.replace("Pago del pedido · ", "")}` : ""}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-emerald-700">{dinero(m.monto)}</span>
                  </li>
                ))}
              </ul>
            )}
            {!cancelado && <FormularioPago pedidoId={id!} saldo={Math.max(saldo, 0)} hoy={datos.hoy} alGuardar={recargar} />}
          </Tarjeta>

          <div className="flex flex-col gap-2">
            {!cancelado ? (
              <button type="button" onClick={() => cambiarEstado("cancelado", "¿Marcar este pedido como cancelado?")} className="boton-secundario w-full">
                <Ban className="size-4" /> Cancelar pedido
              </button>
            ) : (
              <button type="button" onClick={() => cambiarEstado("pendiente")} className="boton-secundario w-full">
                Reactivar pedido
              </button>
            )}
            <button type="button" onClick={borrar} className="boton-peligro w-full">
              <Trash2 className="size-4" /> Borrar pedido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FormularioPago({ pedidoId, saldo, hoy, alGuardar }: { pedidoId: string; saldo: number; hoy: string; alGuardar: () => void }) {
  const { enviando, error, ok, enviar } = useEnvio();
  const [monto, setMonto] = useState(saldo > 0 ? String(saldo) : "");
  const [fecha, setFecha] = useState(hoy);
  const [categoria, setCategoria] = useState("Venta");
  const [medio, setMedio] = useState("Transferencia");

  function guardar(e: FormEvent) {
    e.preventDefault();
    enviar(async () => {
      await api.post(`/pedidos/${pedidoId}/pagos`, { monto, fecha, categoria, descripcion: `Pago del pedido · ${medio}` });
      setMonto("");
      alGuardar();
      return "Pago registrado.";
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      {error && <Aviso>{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="etiqueta">Monto</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" className="campo pl-7" required />
          </div>
        </label>
        <label className="block">
          <span className="etiqueta">Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Tipo</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo">
            <option value="Venta">Pago</option>
            <option value="Seña">Seña</option>
          </select>
        </label>
        <label className="block">
          <span className="etiqueta">Medio</span>
          <select value={medio} onChange={(e) => setMedio(e.target.value)} className="campo">
            <option>Transferencia</option>
            <option>Efectivo</option>
            <option>Mercado Pago</option>
            <option>Otro</option>
          </select>
        </label>
      </div>
      <Boton cargando={enviando} className="boton-primario w-full">Registrar pago</Boton>
      <p className="ayuda text-center">Se suma automáticamente a los ingresos en Finanzas.</p>
    </form>
  );
}

function Linea({ etiqueta, valor, fuerte, clase = "" }: { etiqueta: string; valor: string; fuerte?: boolean; clase?: string }) {
  return (
    <div className={`flex justify-between ${fuerte ? "font-semibold" : "text-stone-600"} ${clase}`}>
      <dt>{etiqueta}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}

function Fila({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="mt-0.5 text-stone-400">{icono}</dt>
      <dd className="whitespace-pre-line text-stone-800">{children}</dd>
    </div>
  );
}
