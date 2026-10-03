import { useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useSesion } from "../lib/sesion";
import { useEnvio } from "../lib/datos";
import { useTitulo } from "../lib/titulo";
import { useMarco } from "../components/marco";
import type { Ajustes as TipoAjustes } from "../lib/tipos";
import { Aviso, Cargando, Encabezado } from "../components/ui";
import { Boton } from "../components/botones";

/** Reemplaza {nombre}, {pedido}, etc. para la vista previa. */
function completar(plantilla: string, valores: Record<string, string>) {
  return plantilla.replace(/\{(\w+)\}/g, (todo, clave: string) => valores[clave] ?? todo);
}

export function Ajustes() {
  useTitulo("Ajustes");
  const { sesion } = useSesion();
  const { ajustes, recargarAjustes } = useMarco();
  if (!ajustes) return <Cargando />;

  return (
    <>
      <Encabezado titulo="Ajustes" subtitulo={`Sesión iniciada como ${sesion?.user.email}`} />
      <div className="space-y-4">
        <FormularioAjustes ajustes={ajustes} alGuardar={recargarAjustes} />
        <div className="flex justify-center pt-4">
          <button type="button" onClick={() => supabase.auth.signOut()} className="boton-secundario">
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}

function FormularioAjustes({ ajustes, alGuardar }: { ajustes: TipoAjustes; alGuardar: () => void }) {
  const { enviando, error, ok, enviar } = useEnvio();
  const [negocio, setNegocio] = useState(ajustes.nombre_negocio);
  const [prefijo, setPrefijo] = useState(ajustes.prefijo_whatsapp);
  const [mensaje, setMensaje] = useState(ajustes.mensaje_listo);
  const ejemplo = completar(mensaje, { nombre: "Ana", negocio, pedido: "12", total: "$ 18.500", saldo: "$ 9.250" });

  function guardar(e: FormEvent) {
    e.preventDefault();
    enviar(async () => {
      await api.put("/ajustes", { nombre_negocio: negocio, prefijo_whatsapp: prefijo, mensaje_listo: mensaje });
      alGuardar();
      return "Ajustes guardados.";
    });
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-4 p-4 sm:p-6">
      {error && <Aviso>{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="nombre_negocio" className="etiqueta">Nombre del negocio</label>
          <input id="nombre_negocio" value={negocio} onChange={(e) => setNegocio(e.target.value)} className="campo" />
        </div>
        <div>
          <label htmlFor="prefijo_whatsapp" className="etiqueta">Código de país WhatsApp</label>
          <input id="prefijo_whatsapp" value={prefijo} onChange={(e) => setPrefijo(e.target.value)} inputMode="numeric" className="campo" />
          <p className="ayuda">Argentina: 549 · Uruguay: 598 · Chile: 56</p>
        </div>
      </div>
      <div>
        <label htmlFor="mensaje_listo" className="etiqueta">Mensaje de “pedido listo”</label>
        <textarea id="mensaje_listo" rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="campo" />
        <p className="ayuda">
          Se reemplazan solos: <code>{"{nombre}"}</code> <code>{"{negocio}"}</code> <code>{"{pedido}"}</code> <code>{"{total}"}</code> <code>{"{saldo}"}</code>
        </p>
      </div>
      <div className="rounded-2xl bg-[#e7f8ee] p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-800">Vista previa</p>
        <p className="whitespace-pre-line rounded-xl rounded-tl-none bg-white p-3 text-sm text-stone-800 shadow-sm">{ejemplo}</p>
      </div>
      <div className="flex justify-end">
        <Boton cargando={enviando} className="boton-primario w-full sm:w-auto">Guardar ajustes</Boton>
      </div>
    </form>
  );
}
