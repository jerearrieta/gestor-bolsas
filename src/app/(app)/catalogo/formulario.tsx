"use client";

import { useActionState, useState } from "react";
import { guardarProducto } from "./actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";
import { costoBolsa, margenReal, precioSugerido, redondearPrecio } from "@/lib/precios";
import { dinero, numero } from "@/lib/format";
import type { Producto } from "@/lib/tipos";

function n(v: string) {
  const x = Number(v.replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export function FormularioProducto({
  producto,
  precioMetro,
  margen,
}: {
  producto?: Producto;
  precioMetro: number;
  margen: number;
}) {
  const [estado, accion] = useActionState(guardarProducto, undefined);
  const [precio, setPrecio] = useState(String(producto?.precio ?? ""));
  const [metros, setMetros] = useState(String(producto?.metros_lienzo ?? ""));
  const [otros, setOtros] = useState(String(producto?.otros_costos ?? ""));

  const costo = costoBolsa(precioMetro, n(metros), n(otros));
  const sugerido = redondearPrecio(precioSugerido(costo, margen));
  const margenActual = margenReal(n(precio), costo);

  return (
    <form action={accion} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="tarjeta space-y-4 p-4 sm:p-6">
        {estado?.error && <Aviso>{estado.error}</Aviso>}
        {producto && <input type="hidden" name="id" value={producto.id} />}
        <div>
          <label htmlFor="nombre" className="etiqueta">Nombre *</label>
          <input id="nombre" name="nombre" required defaultValue={producto?.nombre} className="campo" placeholder="Ej: Tote bag 35x40 estampada" />
        </div>
        <div>
          <label htmlFor="descripcion" className="etiqueta">Descripción</label>
          <textarea id="descripcion" name="descripcion" rows={2} defaultValue={producto?.descripcion ?? ""} className="campo" placeholder="Medidas, tipo de lienzo, colores…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="metros_lienzo" className="etiqueta">Metros de lienzo por bolsa</label>
            <input id="metros_lienzo" name="metros_lienzo" inputMode="decimal" value={metros} onChange={(e) => setMetros(e.target.value)} className="campo" placeholder="Ej: 0,5" />
          </div>
          <div>
            <label htmlFor="otros_costos" className="etiqueta">Otros costos por bolsa ($)</label>
            <input id="otros_costos" name="otros_costos" inputMode="decimal" value={otros} onChange={(e) => setOtros(e.target.value)} className="campo" placeholder="Hilo, manijas, estampado…" />
          </div>
        </div>
        <div>
          <label htmlFor="precio" className="etiqueta">Precio de venta ($) *</label>
          <input id="precio" name="precio" required inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} className="campo text-lg font-semibold" />
        </div>
        <label className="flex items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} className="size-5 accent-marca-600" />
          Producto activo (aparece al cargar pedidos)
        </label>
        <div className="flex justify-end">
          <BotonEnviar className="boton-primario w-full sm:w-auto">{producto ? "Guardar cambios" : "Crear producto"}</BotonEnviar>
        </div>
      </div>

      <aside className="tarjeta h-fit space-y-3 bg-marca-50/60 p-4 sm:p-5">
        <h2 className="font-semibold text-stone-900">Costo y precio sugerido</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-stone-600">Lienzo ({numero(n(metros), 3)} m × {dinero(precioMetro)})</dt><dd className="tabular-nums">{dinero(precioMetro * n(metros))}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-600">Otros costos</dt><dd className="tabular-nums">{dinero(n(otros))}</dd></div>
          <div className="flex justify-between border-t border-marca-200 pt-2 font-semibold"><dt>Costo por bolsa</dt><dd className="tabular-nums">{dinero(costo)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-600">Precio sugerido ({numero(margen)}% de margen)</dt><dd className="font-semibold tabular-nums text-marca-700">{dinero(sugerido)}</dd></div>
          {n(precio) > 0 && costo > 0 && (
            <div className="flex justify-between"><dt className="text-stone-600">Margen con tu precio</dt><dd className={`font-semibold tabular-nums ${margenActual < margen ? "text-rose-700" : "text-emerald-700"}`}>{numero(margenActual, 1)}%</dd></div>
          )}
        </dl>
        {sugerido > 0 && sugerido !== n(precio) && (
          <button type="button" onClick={() => setPrecio(String(sugerido))} className="boton-secundario w-full">
            Usar precio sugerido ({dinero(sugerido)})
          </button>
        )}
        {precioMetro === 0 && (
          <p className="text-xs text-stone-500">Tip: cargá cuánto te cuesta el metro de lienzo en la Calculadora para ver el costo real.</p>
        )}
      </aside>
    </form>
  );
}
