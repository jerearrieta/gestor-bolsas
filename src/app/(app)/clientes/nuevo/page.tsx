import type { Metadata } from "next";
import { Encabezado } from "@/components/ui";
import { FormularioCliente } from "../formulario";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NuevoClientePage({ searchParams }: PageProps<"/clientes/nuevo">) {
  const { volver } = await searchParams;
  const volverA = typeof volver === "string" && volver.startsWith("/") ? volver : undefined;
  return (
    <>
      <Encabezado titulo="Nuevo cliente" volver={volverA ?? "/clientes"} />
      <FormularioCliente volverA={volverA} />
    </>
  );
}
