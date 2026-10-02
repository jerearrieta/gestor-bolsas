"use client";

import { useActionState } from "react";
import { guardarCliente } from "./actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";
import type { Cliente } from "@/lib/tipos";

export function FormularioCliente({ cliente, volverA }: { cliente?: Cliente; volverA?: string }) {
  const [estado, accion] = useActionState(guardarCliente, undefined);
  return (
    <form action={accion} className="tarjeta space-y-4 p-4 sm:p-6">
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      {volverA && <input type="hidden" name="volver_a" value={volverA} />}

      <div>
        <label htmlFor="nombre" className="etiqueta">Nombre y apellido *</label>
        <input id="nombre" name="nombre" required defaultValue={cliente?.nombre} className="campo" placeholder="Ej: Ana Gómez" autoFocus={!cliente} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="telefono" className="etiqueta">WhatsApp / teléfono</label>
          <input id="telefono" name="telefono" type="tel" inputMode="tel" defaultValue={cliente?.telefono ?? ""} className="campo" placeholder="Ej: 11 2345 6789" />
          <p className="ayuda">Con código de área, sin 0 ni 15.</p>
        </div>
        <div>
          <label htmlFor="email" className="etiqueta">Email</label>
          <input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} className="campo" placeholder="opcional" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="direccion" className="etiqueta">Dirección de envío</label>
          <input id="direccion" name="direccion" defaultValue={cliente?.direccion ?? ""} className="campo" placeholder="Calle, número, piso" />
        </div>
        <div>
          <label htmlFor="localidad" className="etiqueta">Localidad</label>
          <input id="localidad" name="localidad" defaultValue={cliente?.localidad ?? ""} className="campo" placeholder="Ciudad / CP" />
        </div>
      </div>

      <div>
        <label htmlFor="notas" className="etiqueta">Notas</label>
        <textarea id="notas" name="notas" rows={3} defaultValue={cliente?.notas ?? ""} className="campo" placeholder="Preferencias, cómo nos conoció, etc." />
      </div>

      <div className="flex justify-end">
        <BotonEnviar className="boton-primario w-full sm:w-auto">{cliente ? "Guardar cambios" : "Crear cliente"}</BotonEnviar>
      </div>
    </form>
  );
}
