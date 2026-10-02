import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/format";
import { Encabezado } from "@/components/ui";
import { FormularioPedido, type PedidoInicial } from "../../formulario";

export default async function EditarPedidoPage({ params }: PageProps<"/pedidos/[id]/editar">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data: pedido }, { data: items }, { data: clientes }, { data: productos }] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).maybeSingle(),
    supabase.from("pedido_items").select("producto_id, descripcion, cantidad, precio_unitario").eq("pedido_id", id).order("posicion"),
    supabase.from("clientes").select("id, nombre, telefono, direccion, localidad").order("nombre"),
    supabase.from("productos").select("id, nombre, precio").eq("activo", true).order("nombre"),
  ]);
  if (!pedido) notFound();
  const inicial: PedidoInicial = { ...pedido, items: items ?? [] };
  return (
    <>
      <Encabezado titulo={`Editar pedido #${pedido.numero}`} volver={`/pedidos/${id}`} />
      <FormularioPedido
        pedido={inicial}
        clientes={clientes ?? []}
        productos={(productos ?? []).map((p) => ({ ...p, precio: Number(p.precio) }))}
        hoy={hoyISO()}
      />
    </>
  );
}
