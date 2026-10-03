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

type ProductoParaLista = { nombre: string; medidas: { medida: string; precio: number }[] };

/** Lista de precios lista para mandar por WhatsApp (*negrita* para cada producto). */
export function textoListaPrecios(productos: ProductoParaLista[], negocio: string, nombre?: string | null) {
  const bloques = productos
    .filter((p) => p.medidas.length > 0)
    .map((p) => {
      const conMedida = p.medidas.filter((m) => m.medida);
      if (conMedida.length === 0) return `*${p.nombre}*: ${dinero(p.medidas[0].precio)}`;
      return [`*${p.nombre}*`, ...conMedida.map((m) => `• ${m.medida}: ${dinero(m.precio)}`)].join("\n");
    });
  const saludo = nombre ? `¡Hola ${nombre}!` : "¡Hola!";
  return `${saludo} Te paso la lista de precios actualizada de ${negocio}:\n\n${bloques.join("\n\n")}\n\nCualquier consulta, escribime por acá.`;
}
