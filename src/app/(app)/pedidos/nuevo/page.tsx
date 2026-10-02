import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/format";
import { Encabezado } from "@/components/ui";
import { FormularioPedido } from "../formulario";

export const metadata: Metadata = { title: "Nuevo pedido" };

export default async function NuevoPedidoPage({ searchParams }: PageProps<"/pedidos/nuevo">) {
  const { cliente } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: clientes }, { data: productos }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, telefono, direccion, localidad").order("nombre"),
    supabase.from("productos").select("id, nombre, precio").eq("activo", true).order("nombre"),
  ]);
  return (
    <>
      <Encabezado titulo="Nuevo pedido" volver="/pedidos" />
      <FormularioPedido
        clientes={clientes ?? []}
        productos={(productos ?? []).map((p) => ({ ...p, precio: Number(p.precio) }))}
        clienteInicial={typeof cliente === "string" ? cliente : undefined}
        hoy={hoyISO()}
      />
    </>
  );
}
