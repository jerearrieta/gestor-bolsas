"use client";

import { useActionState } from "react";
import { TrendingUp } from "lucide-react";
import { aumentarPrecios } from "./actions";
import { BotonConfirmar } from "@/components/botones";
import { Aviso } from "@/components/ui";

export function AumentoMasivo() {
  const [estado, accion] = useActionState(aumentarPrecios, undefined);
  return (
    <details className="tarjeta group mb-4 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-stone-800 hover:bg-stone-50">
        <TrendingUp className="size-4 text-marca-600" /> Actualizar todos los precios a la vez
        <span className="ml-auto text-xs font-normal text-stone-500 group-open:hidden">Ej: +10% por inflación</span>
      </summary>
      <form action={accion} className="space-y-3 border-t border-stone-100 px-4 py-4">
        {estado?.error && <Aviso>{estado.error}</Aviso>}
        {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="porcentaje" className="etiqueta">Porcentaje</label>
            <div className="relative">
              <input id="porcentaje" name="porcentaje" inputMode="decimal" required placeholder="10" className="campo pr-8" />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">%</span>
            </div>
          </div>
          <div>
            <label htmlFor="redondeo" className="etiqueta">Redondear a</label>
            <select id="redondeo" name="redondeo" defaultValue="50" className="campo">
              <option value="0">Sin redondeo</option>
              <option value="10">$10</option>
              <option value="50">$50</option>
              <option value="100">$100</option>
              <option value="500">$500</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <BotonConfirmar className="boton-primario w-full" mensaje="¿Aplicar el cambio a todos los productos activos?">
              Aplicar
            </BotonConfirmar>
          </div>
        </div>
        <p className="ayuda">Usá un número negativo para bajar precios (ej: -5). Sólo afecta a productos activos; los pedidos ya cargados no cambian.</p>
      </form>
    </details>
  );
}
