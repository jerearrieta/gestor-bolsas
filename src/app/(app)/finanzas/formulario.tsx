"use client";

import { useActionState, useState } from "react";
import { agregarMovimiento } from "./actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from "@/lib/tipos";

export function FormularioMovimiento({ hoy }: { hoy: string }) {
  const [estado, accion] = useActionState(agregarMovimiento, undefined);
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const categorias = tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;

  return (
    <form action={accion} className="space-y-3">
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      <input type="hidden" name="tipo" value={tipo} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1" role="radiogroup" aria-label="Tipo de movimiento">
        {(["gasto", "ingreso"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => setTipo(t)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              tipo === t ? (t === "gasto" ? "bg-white text-rose-700 shadow-sm" : "bg-white text-emerald-700 shadow-sm") : "text-stone-500"
            }`}
          >
            {t === "gasto" ? "− Gasto" : "+ Ingreso"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="etiqueta">Monto</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input name="monto" inputMode="decimal" required className="campo pl-7" placeholder="0" />
          </div>
        </label>
        <label className="block">
          <span className="etiqueta">Fecha</span>
          <input name="fecha" type="date" defaultValue={hoy} className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="etiqueta">Categoría</span>
        <select name="categoria" className="campo" key={tipo}>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="etiqueta">Detalle</span>
        <input name="descripcion" className="campo" placeholder={tipo === "gasto" ? "Ej: 20 m de lienzo crudo" : "Ej: venta en feria"} />
      </label>
      <BotonEnviar className="boton-primario w-full">Guardar {tipo}</BotonEnviar>
      <p className="ayuda text-center">Los pagos de pedidos se registran solos desde cada pedido.</p>
    </form>
  );
}
