import { dinero } from "./formato.js";
import { completarPlantilla, enlaceWhatsApp } from "./whatsapp.js";
import type { Ajustes } from "./ajustes.js";

type PedidoParaAviso = {
  numero: number;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  total: number;
  saldo: number;
};

/** Enlace de WhatsApp con el aviso de "pedido listo" ya escrito. */
export function avisoPedidoListo(pedido: PedidoParaAviso, ajustes: Ajustes) {
  const mensaje = completarPlantilla(ajustes.mensaje_listo, {
    nombre: (pedido.cliente_nombre ?? "").split(" ")[0],
    negocio: ajustes.nombre_negocio,
    pedido: String(pedido.numero),
    total: dinero(pedido.total),
    saldo: dinero(Math.max(Number(pedido.saldo), 0)),
  });
  return enlaceWhatsApp(pedido.cliente_telefono, mensaje, ajustes.prefijo_whatsapp);
}
