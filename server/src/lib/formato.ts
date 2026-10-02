const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** $ 12.500 (para los mensajes de WhatsApp) */
export function dinero(valor: number | string | null | undefined) {
  return moneda.format(Number(valor ?? 0));
}

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de Argentina. */
export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

/** "2026-10" -> [primer día, primer día del mes siguiente) */
export function rangoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const desde = `${a}-${String(m).padStart(2, "0")}-01`;
  const sig = m === 12 ? { a: a + 1, m: 1 } : { a, m: m + 1 };
  return { desde, hasta: `${sig.a}-${String(sig.m).padStart(2, "0")}-01` };
}
