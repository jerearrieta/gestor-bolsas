/** Costo de fabricar una bolsa: lienzo usado + otros costos (hilo, manijas, estampado, mano de obra...). */
export function costoBolsa(precioMetro: number, metros: number, otrosCostos: number) {
  return precioMetro * metros + otrosCostos;
}

/**
 * Precio de venta para que la ganancia sea `margen`% del precio.
 * Ej: costo $600 y margen 40% -> $1.000 (de cada $1.000, $400 son ganancia).
 */
export function precioSugerido(costo: number, margen: number) {
  if (costo <= 0) return 0;
  const m = Math.min(Math.max(margen, 0), 95) / 100;
  return costo / (1 - m);
}

/** Redondea hacia arriba a múltiplos de `paso` (por defecto $10). */
export function redondearPrecio(valor: number, paso = 10) {
  if (valor <= 0) return 0;
  return Math.ceil(valor / paso) * paso;
}

/** Margen real (en %) de vender a `precio` algo que cuesta `costo`. */
export function margenReal(precio: number, costo: number) {
  if (precio <= 0) return 0;
  return ((precio - costo) / precio) * 100;
}
