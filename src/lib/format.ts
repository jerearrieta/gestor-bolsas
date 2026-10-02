const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** $ 12.500 */
export function dinero(valor: number | string | null | undefined) {
  return moneda.format(Number(valor ?? 0));
}

export function numero(valor: number | string | null | undefined, decimales = 2) {
  return Number(valor ?? 0).toLocaleString("es-AR", { maximumFractionDigits: decimales });
}

/** Fecha "2026-10-02" -> "2 oct" (o "2 oct 2025" si es de otro año). */
export function fechaCorta(iso: string | null | undefined) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  const mismoAnio = a === new Date().getFullYear();
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    ...(mismoAnio ? {} : { year: "numeric" }),
  });
}

/** Fecha de hoy en formato YYYY-MM-DD según la zona horaria de Argentina. */
export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

/** "2026-10" -> rango [primer día, primer día del mes siguiente) */
export function rangoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const desde = `${a}-${String(m).padStart(2, "0")}-01`;
  const sig = m === 12 ? { a: a + 1, m: 1 } : { a, m: m + 1 };
  const hasta = `${sig.a}-${String(sig.m).padStart(2, "0")}-01`;
  return { desde, hasta };
}

export function nombreMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const texto = new Date(a, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const f = new Date(a, m - 1 + delta, 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
}

/** Lee un número de un formulario aceptando "1.500,50" o "1500.50". */
export function leerNumero(valor: FormDataEntryValue | null, porDefecto = 0) {
  if (valor === null) return porDefecto;
  let texto = String(valor).trim().replace(/\s|\$/g, "");
  if (!texto) return porDefecto;
  if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
  const n = Number(texto);
  return Number.isFinite(n) ? n : porDefecto;
}

export function leerTexto(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}
