export type EstadoPedido = "pendiente" | "en_produccion" | "listo" | "entregado" | "cancelado";

export const ESTADOS: { valor: EstadoPedido; etiqueta: string; clase: string }[] = [
  { valor: "pendiente", etiqueta: "Pendiente", clase: "bg-amber-100 text-amber-800 ring-amber-200" },
  { valor: "en_produccion", etiqueta: "En producción", clase: "bg-sky-100 text-sky-800 ring-sky-200" },
  { valor: "listo", etiqueta: "Listo", clase: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  { valor: "entregado", etiqueta: "Entregado", clase: "bg-stone-200 text-stone-700 ring-stone-300" },
  { valor: "cancelado", etiqueta: "Cancelado", clase: "bg-rose-100 text-rose-700 ring-rose-200" },
];

export const FLUJO: EstadoPedido[] = ["pendiente", "en_produccion", "listo", "entregado"];

export function infoEstado(estado: EstadoPedido) {
  return ESTADOS.find((e) => e.valor === estado) ?? ESTADOS[0];
}

export const CATEGORIAS_GASTO = [
  "Lienzo y telas",
  "Hilos y avíos",
  "Estampado",
  "Envíos",
  "Packaging",
  "Publicidad",
  "Herramientas",
  "Servicios",
  "Otros",
];

export const CATEGORIAS_INGRESO = ["Venta", "Seña", "Otros"];

export type Ajustes = {
  user_id: string;
  nombre_negocio: string;
  precio_metro_lienzo: number;
  margen_objetivo: number;
  prefijo_whatsapp: string;
  mensaje_listo: string;
};

export type Medida = {
  id: string;
  medida: string;
  precio: number;
  metros_lienzo: number;
  otros_costos: number;
  // Calculados por el servidor
  costo: number;
  precio_sugerido: number;
  margen_real: number;
  margen_bajo: boolean;
};

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  medidas: Medida[];
};

/** "Marinera 10x10", o sólo "Marinera" si el producto tiene una única medida sin nombre. */
export function nombreConMedida(producto: string, medida: string) {
  return medida ? `${producto} ${medida}` : producto;
}

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  localidad: string | null;
  notas: string | null;
  creado_en: string;
};

export type PedidoResumen = {
  id: string;
  numero: number;
  cliente_id: string | null;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  estado: EstadoPedido;
  fecha: string;
  fecha_entrega: string | null;
  direccion_envio: string | null;
  costo_envio: number;
  descuento: number;
  notas: string | null;
  subtotal: number;
  unidades: number;
  total: number;
  pagado: number;
  saldo: number;
};

export type PedidoItem = {
  id: string;
  producto_id: string | null;
  medida_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

export type Movimiento = {
  id: string;
  tipo: "ingreso" | "gasto";
  monto: number;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  pedido_id: string | null;
};

