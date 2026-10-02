/**
 * Convierte un teléfono cargado a mano en el formato que pide wa.me
 * (sólo dígitos, con código de país). Para Argentina el prefijo es 549.
 */
export function normalizarTelefono(telefono: string | null | undefined, prefijo = "549") {
  if (!telefono) return null;
  const crudo = telefono.trim();
  let digitos = crudo.replace(/\D/g, "");
  if (digitos.length < 6) return null;

  if (crudo.startsWith("+")) return digitos;
  if (digitos.startsWith("00")) return digitos.slice(2);
  if (prefijo && digitos.startsWith(prefijo)) return digitos;
  // Número argentino con 54 pero sin el 9 de celulares
  if (prefijo === "549" && digitos.startsWith("54") && digitos.length === 12) {
    return `549${digitos.slice(2)}`;
  }
  digitos = digitos.replace(/^0+/, "");
  // Argentina: "11 15 2345-6789" -> se quita el 15 que va después del código de área
  if (prefijo === "549" && digitos.length === 12) {
    for (const largoArea of [2, 3, 4]) {
      if (digitos.slice(largoArea, largoArea + 2) === "15") {
        digitos = digitos.slice(0, largoArea) + digitos.slice(largoArea + 2);
        break;
      }
    }
  }
  return `${prefijo}${digitos}`;
}

export function enlaceWhatsApp(telefono: string | null | undefined, mensaje: string, prefijo = "549") {
  const numero = normalizarTelefono(telefono, prefijo);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Reemplaza {nombre}, {pedido}, etc. en la plantilla del mensaje. */
export function completarPlantilla(plantilla: string, valores: Record<string, string>) {
  return plantilla.replace(/\{(\w+)\}/g, (todo, clave: string) => valores[clave] ?? todo);
}
