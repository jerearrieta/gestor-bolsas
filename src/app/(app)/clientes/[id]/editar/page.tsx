import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Encabezado } from "@/components/ui";
import { FormularioCliente } from "../../formulario";
import type { Cliente } from "@/lib/tipos";

export default async function EditarClientePage({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const cliente = data as Cliente;
  return (
    <>
      <Encabezado titulo="Editar cliente" subtitulo={cliente.nombre} volver={`/clientes/${id}`} />
      <FormularioCliente cliente={cliente} />
    </>
  );
}
