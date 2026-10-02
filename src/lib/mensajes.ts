import { dinero } from "./format";
import { completarPlantilla, enlaceWhatsApp } from "./whatsapp";
import type { Ajustes, PedidoResumen } from "./tipos";

/** Enlace de WhatsApp con el aviso de "pedido listo" ya escrito. */
export function avisoPedidoListo(pedido: PedidoResumen, ajustes: Ajustes) {
  const mensaje = completarPlantilla(ajustes.mensaje_listo, {
    nombre: (pedido.cliente_nombre ?? "").split(" ")[0],
    negocio: ajustes.nombre_negocio,
    pedido: String(pedido.numero),
    total: dinero(pedido.total),
    saldo: dinero(Math.max(Number(pedido.saldo), 0)),
  });
  return enlaceWhatsApp(pedido.cliente_telefono, mensaje, ajustes.prefijo_whatsapp);
}
