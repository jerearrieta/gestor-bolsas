"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { leerTexto } from "@/lib/format";
import type { EstadoFormulario } from "@/lib/tipos";

function datosCliente(formData: FormData) {
  return {
    nombre: leerTexto(formData.get("nombre")),
    telefono: leerTexto(formData.get("telefono")),
    email: leerTexto(formData.get("email")),
    direccion: leerTexto(formData.get("direccion")),
    localidad: leerTexto(formData.get("localidad")),
    notas: leerTexto(formData.get("notas")),
  };
}

export async function guardarCliente(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requireUser();
  const id = leerTexto(formData.get("id"));
  const datos = datosCliente(formData);
  if (!datos.nombre) return { error: "El nombre es obligatorio." };

  const consulta = id
    ? supabase.from("clientes").update(datos).eq("id", id).select("id").single()
    : supabase.from("clientes").insert(datos).select("id").single();
  const { data, error } = await consulta;
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/clientes");
  const volverA = leerTexto(formData.get("volver_a"));
  redirect(volverA ? `${volverA}${volverA.includes("?") ? "&" : "?"}cliente=${data.id}` : `/clientes/${data.id}`);
}

export async function borrarCliente(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar el cliente: ${error.message}`);
  revalidatePath("/clientes");
  redirect("/clientes");
}
