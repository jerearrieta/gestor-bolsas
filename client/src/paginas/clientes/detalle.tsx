import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Mail, MapPin, MessageCircle, Pencil, Phone, Plus, StickyNote, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { dinero, fechaCorta } from "../../lib/formato";
import type { Cliente, PedidoResumen } from "../../lib/tipos";
import { Aviso, Dato, Encabezado, EstadoBadge, EstadoCarga, Tarjeta, TituloSeccion, Vacio } from "../../components/ui";
import { Boton } from "../../components/botones";

type DatosCliente = {
  cliente: Cliente;
  pedidos: PedidoResumen[];
  total_comprado: number;
  deuda: number;
  whatsapp: string | null;
  telefono_internacional: string | null;
};

export function DetalleCliente() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos, error } = useDatos<DatosCliente>(`/clientes/${id}`);
  const borrado = useEnvio();
  useTitulo(datos?.cliente.nombre ?? "Cliente");
  if (!datos) return <EstadoCarga error={error} />;
  const { cliente, pedidos } = datos;
  const validos = pedidos.filter((p) => p.estado !== "cancelado");

  function borrar() {
    if (!confirm(`¿Borrar a ${cliente.nombre}? Sus pedidos se conservan, pero quedan sin cliente asignado.`)) return;
    borrado.enviar(async () => {
      await api.delete(`/clientes/${id}`);
      navegar("/clientes", { replace: true });
    });
  }

  return (
    <>
      <Encabezado
        titulo={cliente.nombre}
        subtitulo={`Cliente desde ${fechaCorta(cliente.creado_en)}`}
        volver="/clientes"
        acciones={
          <Link to={`/clientes/${id}/editar`} className="boton-secundario">
            <Pencil className="size-4" /> Editar
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {datos.whatsapp && (
          <a href={datos.whatsapp} target="_blank" rel="noopener noreferrer" className="boton-whatsapp flex-1 sm:flex-none">
            <MessageCircle className="size-4" /> Escribir por WhatsApp
          </a>
        )}
        {datos.telefono_internacional && (
          <a href={`tel:+${datos.telefono_internacional}`} className="boton-secundario flex-1 sm:flex-none">
            <Phone className="size-4" /> Llamar
          </a>
        )}
        <Link to={`/pedidos/nuevo?cliente=${id}`} className="boton-primario flex-1 sm:flex-none">
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
              <Fila icono={<MapPin className="size-4" />} valor={[cliente.direccion, cliente.localidad].filter(Boolean).join(", ") || null} vacio="Sin dirección de envío" />
              {cliente.notas && <Fila icono={<StickyNote className="size-4" />} valor={cliente.notas} vacio="" />}
            </dl>
          </Tarjeta>
          <div className="grid grid-cols-2 gap-3">
            <Dato etiqueta="Total comprado" valor={dinero(datos.total_comprado)} detalle={`${validos.length} pedidos`} />
            <Dato etiqueta="Debe" valor={dinero(datos.deuda)} tono={datos.deuda > 0 ? "negativo" : "normal"} />
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
                  <Link to={`/pedidos/${p.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-stone-50">
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

      <div className="mt-8 flex flex-col items-center gap-2">
        {borrado.error && <Aviso>{borrado.error}</Aviso>}
        <Boton type="button" onClick={borrar} cargando={borrado.enviando} textoCargando="Borrando…" className="boton-peligro">
          <Trash2 className="size-4" /> Borrar cliente
        </Boton>
      </div>
    </>
  );
}

function Fila({ icono, valor, vacio }: { icono: ReactNode; valor: string | null; vacio: string }) {
  return (
    <div className="flex gap-3">
      <dt className="mt-0.5 text-stone-400">{icono}</dt>
      <dd className={valor ? "whitespace-pre-line text-stone-800" : "text-stone-400"}>{valor ?? vacio}</dd>
    </div>
  );
}
