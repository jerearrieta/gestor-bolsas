import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, CalendarClock, Check, MapPin, MessageCircle, Pencil, Phone, StickyNote, Trash2, User } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { avisoPedidoListo } from "@/lib/mensajes";
import { dinero, fechaCorta, hoyISO } from "@/lib/format";
import { FLUJO, infoEstado, type Movimiento, type PedidoItem, type PedidoResumen } from "@/lib/tipos";
import { Encabezado, EstadoBadge, Tarjeta, TituloSeccion } from "@/components/ui";
import { BotonConfirmar, BotonEnviar } from "@/components/botones";
import { borrarPedido, cambiarEstado } from "../actions";
import { FormularioPago } from "./pago";

export default async function PedidoPage({ params }: PageProps<"/pedidos/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data }, { data: itemsData }, { data: pagosData }, ajustes] = await Promise.all([
    supabase.from("pedidos_resumen").select("*").eq("id", id).maybeSingle(),
    supabase.from("pedido_items").select("*").eq("pedido_id", id).order("posicion"),
    supabase.from("movimientos").select("*").eq("pedido_id", id).order("fecha"),
    obtenerAjustes(supabase),
  ]);
  if (!data) notFound();
  const pedido = data as PedidoResumen;
  const items = (itemsData ?? []) as PedidoItem[];
  const pagos = (pagosData ?? []) as Movimiento[];
  const saldo = Number(pedido.saldo);
  const wa = avisoPedidoListo(pedido, ajustes);
  const cancelado = pedido.estado === "cancelado";
  const pasoActual = FLUJO.indexOf(pedido.estado);
  const siguiente = pasoActual >= 0 && pasoActual < FLUJO.length - 1 ? FLUJO[pasoActual + 1] : null;

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
          <Link href={`/pedidos/${id}/editar`} className="boton-secundario">
            <Pencil className="size-4" /> Editar
          </Link>
        }
      />

      {/* Avance del pedido */}
      {!cancelado && (
        <Tarjeta className="mb-4">
          <ol className="grid grid-cols-4 gap-1">
            {FLUJO.map((e, i) => {
              const hecho = i <= pasoActual;
              return (
                <li key={e} className="flex flex-col items-center gap-1.5 text-center">
                  <form action={cambiarEstado} className="contents">
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="estado" value={e} />
                    <button
                      type="submit"
                      title={`Marcar como ${infoEstado(e).etiqueta}`}
                      className={`grid size-9 place-items-center rounded-full border-2 text-sm font-bold transition ${
                        hecho ? "border-marca-600 bg-marca-600 text-white" : "border-stone-300 bg-white text-stone-400 hover:border-marca-400"
                      }`}
                    >
                      {hecho ? <Check className="size-4" /> : i + 1}
                    </button>
                  </form>
                  <span className={`text-[11px] font-medium leading-tight sm:text-xs ${i === pasoActual ? "text-marca-800" : "text-stone-500"}`}>
                    {infoEstado(e).etiqueta}
                  </span>
                </li>
              );
            })}
          </ol>
          {siguiente && (
            <form action={cambiarEstado} className="mt-4">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="estado" value={siguiente} />
              <BotonEnviar className="boton-primario w-full" pendiente="Actualizando…">
                Pasar a “{infoEstado(siguiente).etiqueta}”
              </BotonEnviar>
            </form>
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
              Para avisar por WhatsApp, {pedido.cliente_id ? (
                <Link href={`/clientes/${pedido.cliente_id}/editar`} className="font-medium text-marca-700 underline">cargale un teléfono al cliente</Link>
              ) : "asigná un cliente con teléfono a este pedido"}.
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
              <Linea
                etiqueta={saldo > 0 ? "Falta cobrar" : "Saldo"}
                valor={dinero(Math.max(saldo, 0))}
                fuerte
                clase={saldo > 0 ? "text-rose-700" : "text-emerald-700"}
              />
            </dl>
          </Tarjeta>

          <Tarjeta>
            <TituloSeccion>Entrega</TituloSeccion>
            <dl className="space-y-3 text-sm">
              <Fila icono={<User className="size-4" />}>
                {pedido.cliente_id ? (
                  <Link href={`/clientes/${pedido.cliente_id}`} className="font-medium text-marca-700 hover:underline">{pedido.cliente_nombre}</Link>
                ) : (
                  <span className="text-stone-400">Sin cliente</span>
                )}
              </Fila>
              {pedido.cliente_telefono && (
                <Fila icono={<Phone className="size-4" />}>{pedido.cliente_telefono}</Fila>
              )}
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
                      <span className="block text-xs text-stone-500">{fechaCorta(m.fecha)}{m.descripcion ? ` · ${m.descripcion.replace("Pago del pedido · ", "")}` : ""}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-emerald-700">{dinero(m.monto)}</span>
                  </li>
                ))}
              </ul>
            )}
            {!cancelado && <FormularioPago pedidoId={id} saldo={Math.max(saldo, 0)} hoy={hoyISO()} />}
          </Tarjeta>

          <div className="flex flex-col gap-2">
            {!cancelado ? (
              <form action={cambiarEstado}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="estado" value="cancelado" />
                <BotonConfirmar className="boton-secundario w-full" mensaje="¿Marcar este pedido como cancelado?">
                  <Ban className="size-4" /> Cancelar pedido
                </BotonConfirmar>
              </form>
            ) : (
              <form action={cambiarEstado}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="estado" value="pendiente" />
                <BotonEnviar className="boton-secundario w-full">Reactivar pedido</BotonEnviar>
              </form>
            )}
            <form action={borrarPedido}>
              <input type="hidden" name="id" value={id} />
              <BotonConfirmar className="boton-peligro w-full" mensaje="¿Borrar el pedido definitivamente? Los pagos registrados se mantienen en Finanzas.">
                <Trash2 className="size-4" /> Borrar pedido
              </BotonConfirmar>
            </form>
          </div>
        </div>
      </div>
    </>
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

function Fila({ icono, children }: { icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="mt-0.5 text-stone-400">{icono}</dt>
      <dd className="whitespace-pre-line text-stone-800">{children}</dd>
    </div>
  );
}
