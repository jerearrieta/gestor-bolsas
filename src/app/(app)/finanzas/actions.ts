"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { hoyISO, leerNumero, leerTexto } from "@/lib/format";
import type { EstadoFormulario } from "@/lib/tipos";

export async function agregarMovimiento(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requireUser();
  const tipo = formData.get("tipo") === "ingreso" ? "ingreso" : "gasto";
  const monto = leerNumero(formData.get("monto"));
  if (monto <= 0) return { error: "Ingresá un monto mayor a 0." };
  const { error } = await supabase.from("movimientos").insert({
    tipo,
    monto,
    categoria: leerTexto(formData.get("categoria")) ?? "Otros",
    descripcion: leerTexto(formData.get("descripcion")),
    fecha: leerTexto(formData.get("fecha")) ?? hoyISO(),
  });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/", "layout");
  return { ok: `${tipo === "gasto" ? "Gasto" : "Ingreso"} registrado.` };
}

export async function borrarMovimiento(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("movimientos").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
  revalidatePath("/", "layout");
}
