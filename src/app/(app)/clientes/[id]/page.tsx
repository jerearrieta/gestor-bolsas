import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, MessageCircle, Pencil, Phone, Plus, StickyNote, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { dinero, fechaCorta } from "@/lib/format";
import { enlaceWhatsApp, normalizarTelefono } from "@/lib/whatsapp";
import { Dato, Encabezado, EstadoBadge, Tarjeta, TituloSeccion, Vacio } from "@/components/ui";
import { BotonConfirmar } from "@/components/botones";
import { borrarCliente } from "../actions";
import type { Cliente, PedidoResumen } from "@/lib/tipos";

export default async function ClientePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data }, { data: pedidosData }, ajustes] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("pedidos_resumen").select("*").eq("cliente_id", id).order("fecha", { ascending: false }),
    obtenerAjustes(supabase),
  ]);
  if (!data) notFound();
  const cliente = data as Cliente;
  const pedidos = (pedidosData ?? []) as PedidoResumen[];
  const validos = pedidos.filter((p) => p.estado !== "cancelado");
  const totalComprado = validos.reduce((s, p) => s + Number(p.total), 0);
  const saldo = validos.reduce((s, p) => s + Math.max(Number(p.saldo), 0), 0);

  const primerNombre = cliente.nombre.split(" ")[0];
  const wa = enlaceWhatsApp(cliente.telefono, `Hola ${primerNombre}! Te escribimos de ${ajustes.nombre_negocio}. `, ajustes.prefijo_whatsapp);
  const tel = normalizarTelefono(cliente.telefono, ajustes.prefijo_whatsapp);

  return (
    <>
      <Encabezado
        titulo={cliente.nombre}
        subtitulo={`Cliente desde ${fechaCorta(cliente.creado_en)}`}
        volver="/clientes"
        acciones={
          <Link href={`/clientes/${id}/editar`} className="boton-secundario">
            <Pencil className="size-4" /> Editar
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="boton-whatsapp flex-1 sm:flex-none">
            <MessageCircle className="size-4" /> Escribir por WhatsApp
          </a>
        )}
        {tel && (
          <a href={`tel:+${tel}`} className="boton-secundario flex-1 sm:flex-none">
            <Phone className="size-4" /> Llamar
          </a>
        )}
        <Link href={`/pedidos/nuevo?cliente=${id}`} className="boton-primario flex-1 sm:flex-none">
          <Plus className="size-4" /> Nuevo pedido
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Tarjeta>
            <TituloSeccion>Datos de contacto</TituloSeccion>
            <dl className="space-y-3 text-sm">
              <Fila icono={<Phone className="size-4" />} valor={cliente.telefono} vacio="Sin teléfono" />
              <Fila icono={<Mail className="size-4" />} valor={cliente.email} vacio="Sin email" />
              <Fila
                icono={<MapPin className="size-4" />}
                valor={[cliente.direccion, cliente.localidad].filter(Boolean).join(", ") || null}
                vacio="Sin dirección de envío"
              />
              {cliente.notas && <Fila icono={<StickyNote className="size-4" />} valor={cliente.notas} vacio="" />}
            </dl>
          </Tarjeta>
          <div className="grid grid-cols-2 gap-3">
            <Dato etiqueta="Total comprado" valor={dinero(totalComprado)} detalle={`${validos.length} pedidos`} />
            <Dato etiqueta="Debe" valor={dinero(saldo)} tono={saldo > 0 ? "negativo" : "normal"} />
          </div>
        </div>

        <Tarjeta>
          <TituloSeccion>Historial de pedidos</TituloSeccion>
          {pedidos.length === 0 ? (
            <Vacio titulo="Sin pedidos todavía" />
          ) : (
            <ul className="-mx-2 divide-y divide-stone-100">
              {pedidos.map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-stone-50">
                    <span>
                      <span className="font-medium text-stone-900">Pedido #{p.numero}</span>
                      <span className="block text-xs text-stone-500">
                        {fechaCorta(p.fecha)} · {p.unidades} {Number(p.unidades) === 1 ? "unidad" : "unidades"}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums">{dinero(p.total)}</span>
                      <EstadoBadge estado={p.estado} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <form action={borrarCliente} className="mt-8 flex justify-center">
        <input type="hidden" name="id" value={id} />
        <BotonConfirmar mensaje={`¿Borrar a ${cliente.nombre}? Sus pedidos se conservan, pero quedan sin cliente asignado.`}>
          <Trash2 className="size-4" /> Borrar cliente
        </BotonConfirmar>
      </form>
    </>
  );
}

function Fila({ icono, valor, vacio }: { icono: React.ReactNode; valor: string | null; vacio: string }) {
  return (
    <div className="flex gap-3">
      <dt className="mt-0.5 text-stone-400">{icono}</dt>
      <dd className={valor ? "whitespace-pre-line text-stone-800" : "text-stone-400"}>{valor ?? vacio}</dd>
    </div>
  );
}
