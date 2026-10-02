"use client";

import { useActionState } from "react";
import { registrarPago } from "../actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";

export function FormularioPago({ pedidoId, saldo, hoy }: { pedidoId: string; saldo: number; hoy: string }) {
  const [estado, accion] = useActionState(registrarPago, undefined);
  return (
    <form action={accion} className="space-y-3" key={saldo}>
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      <input type="hidden" name="id" value={pedidoId} />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="etiqueta">Monto</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <input name="monto" inputMode="decimal" defaultValue={saldo > 0 ? saldo : ""} className="campo pl-7" required />
          </div>
        </label>
        <label className="block">
          <span className="etiqueta">Fecha</span>
          <input name="fecha" type="date" defaultValue={hoy} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Tipo</span>
          <select name="categoria" className="campo" defaultValue="Venta">
            <option value="Venta">Pago</option>
            <option value="Seña">Seña</option>
          </select>
        </label>
        <label className="block">
          <span className="etiqueta">Medio</span>
          <select name="descripcion" className="campo" defaultValue="Pago del pedido · Transferencia">
            <option value="Pago del pedido · Transferencia">Transferencia</option>
            <option value="Pago del pedido · Efectivo">Efectivo</option>
            <option value="Pago del pedido · Mercado Pago">Mercado Pago</option>
            <option value="Pago del pedido · Otro">Otro</option>
          </select>
        </label>
      </div>
      <BotonEnviar className="boton-primario w-full">Registrar pago</BotonEnviar>
      <p className="ayuda text-center">Se suma automáticamente a los ingresos en Finanzas.</p>
    </form>
  );
}
