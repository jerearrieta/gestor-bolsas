import { requireUser } from "@/lib/supabase/server";
import { obtenerAjustes } from "@/lib/ajustes";
import { BarraInferior, BarraLateral, BarraSuperior } from "@/components/navegacion";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireUser();
  const ajustes = await obtenerAjustes(supabase);

  return (
    <div className="flex min-h-dvh">
      <BarraLateral negocio={ajustes.nombre_negocio} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior negocio={ajustes.nombre_negocio} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>
      <BarraInferior />
    </div>
  );
}
