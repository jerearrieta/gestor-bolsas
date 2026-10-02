"use client";

import { useActionState } from "react";
import { guardarCostosBase } from "../actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";

export function CostosBase({ precioMetro, margen }: { precioMetro: number; margen: number }) {
  const [estado, accion] = useActionState(guardarCostosBase, undefined);
  return (
    <form action={accion} className="tarjeta space-y-4 p-4 sm:p-5">
      <h2 className="font-semibold text-stone-900">1. Tus costos base</h2>
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="precio_metro_lienzo" className="etiqueta">Precio del metro de lienzo</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input id="precio_metro_lienzo" name="precio_metro_lienzo" inputMode="decimal" defaultValue={precioMetro || ""} placeholder="0" className="campo pl-7 text-lg font-semibold" />
          </div>
        </div>
        <div>
          <label htmlFor="margen_objetivo" className="etiqueta">Margen que querés ganar</label>
          <div className="relative">
            <input id="margen_objetivo" name="margen_objetivo" inputMode="decimal" defaultValue={margen} className="campo pr-8 text-lg font-semibold" />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">%</span>
          </div>
        </div>
      </div>
      <p className="ayuda">
        El margen es la parte del precio que te queda de ganancia. Con 50%, de cada $1.000 que cobrás, $500 son ganancia.
      </p>
      <BotonEnviar className="boton-primario w-full">Guardar y recalcular</BotonEnviar>
    </form>
  );
}
