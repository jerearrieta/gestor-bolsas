"use client";

import { useActionState, useState } from "react";
import { guardarAjustes } from "./actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";
import { completarPlantilla } from "@/lib/whatsapp";
import type { Ajustes } from "@/lib/tipos";

export function FormularioAjustes({ ajustes }: { ajustes: Ajustes }) {
  const [estado, accion] = useActionState(guardarAjustes, undefined);
  const [mensaje, setMensaje] = useState(ajustes.mensaje_listo);
  const [negocio, setNegocio] = useState(ajustes.nombre_negocio);
  const ejemplo = completarPlantilla(mensaje, { nombre: "Ana", negocio, pedido: "12", total: "$ 18.500", saldo: "$ 9.250" });

  return (
    <form action={accion} className="tarjeta space-y-4 p-4 sm:p-6">
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="nombre_negocio" className="etiqueta">Nombre del negocio</label>
          <input id="nombre_negocio" name="nombre_negocio" value={negocio} onChange={(e) => setNegocio(e.target.value)} className="campo" />
        </div>
        <div>
          <label htmlFor="prefijo_whatsapp" className="etiqueta">Código de país WhatsApp</label>
          <input id="prefijo_whatsapp" name="prefijo_whatsapp" defaultValue={ajustes.prefijo_whatsapp} inputMode="numeric" className="campo" />
          <p className="ayuda">Argentina: 549 · Uruguay: 598 · Chile: 56</p>
        </div>
      </div>
      <div>
        <label htmlFor="mensaje_listo" className="etiqueta">Mensaje de “pedido listo”</label>
        <textarea id="mensaje_listo" name="mensaje_listo" rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="campo" />
        <p className="ayuda">
          Se reemplazan solos: <code>{"{nombre}"}</code> <code>{"{negocio}"}</code> <code>{"{pedido}"}</code> <code>{"{total}"}</code> <code>{"{saldo}"}</code>
        </p>
      </div>
      <div className="rounded-2xl bg-[#e7f8ee] p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-800">Vista previa</p>
        <p className="whitespace-pre-line rounded-xl rounded-tl-none bg-white p-3 text-sm text-stone-800 shadow-sm">{ejemplo}</p>
      </div>
      <div className="flex justify-end">
        <BotonEnviar className="boton-primario w-full sm:w-auto">Guardar ajustes</BotonEnviar>
      </div>
    </form>
  );
}
