"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { leerTexto } from "@/lib/format";
import type { EstadoFormulario } from "@/lib/tipos";

export async function guardarAjustes(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase, user } = await requireUser();
  const nombre_negocio = leerTexto(formData.get("nombre_negocio"));
  const mensaje_listo = leerTexto(formData.get("mensaje_listo"));
  const prefijo_whatsapp = (leerTexto(formData.get("prefijo_whatsapp")) ?? "").replace(/\D/g, "");
  if (!nombre_negocio) return { error: "El nombre del negocio es obligatorio." };
  if (!mensaje_listo) return { error: "El mensaje no puede quedar vacío." };
  if (!prefijo_whatsapp) return { error: "Ingresá el código de país (para Argentina: 549)." };

  const { error } = await supabase
    .from("ajustes")
    .upsert({ user_id: user.id, nombre_negocio, mensaje_listo, prefijo_whatsapp });
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  revalidatePath("/", "layout");
  return { ok: "Ajustes guardados." };
}
