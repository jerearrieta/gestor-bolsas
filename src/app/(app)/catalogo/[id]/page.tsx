import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { Encabezado } from "@/components/ui";
import { BotonConfirmar } from "@/components/botones";
import { FormularioProducto } from "../formulario";
import { borrarProducto } from "../actions";
import type { Producto } from "@/lib/tipos";

export default async function EditarProductoPage({ params }: PageProps<"/catalogo/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data }, ajustes] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).maybeSingle(),
    obtenerAjustes(supabase),
  ]);
  if (!data) notFound();
  const producto = data as Producto;
  return (
    <>
      <Encabezado titulo="Editar producto" subtitulo={producto.nombre} volver="/catalogo" />
      <FormularioProducto producto={producto} precioMetro={ajustes.precio_metro_lienzo} margen={ajustes.margen_objetivo} />
      <form action={borrarProducto} className="mt-8 flex justify-center">
        <input type="hidden" name="id" value={id} />
        <BotonConfirmar mensaje={`¿Borrar "${producto.nombre}"? Los pedidos ya cargados no se modifican. Si sólo dejaste de venderlo, mejor desmarcá "Producto activo".`}>
          <Trash2 className="size-4" /> Borrar producto
        </BotonConfirmar>
      </form>
    </>
  );
}
