import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { Encabezado } from "@/components/ui";
import { FormularioProducto } from "../formulario";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  const { supabase } = await requireUser();
  const ajustes = await obtenerAjustes(supabase);
  return (
    <>
      <Encabezado titulo="Nuevo producto" volver="/catalogo" />
      <FormularioProducto precioMetro={ajustes.precio_metro_lienzo} margen={ajustes.margen_objetivo} />
    </>
  );
}
