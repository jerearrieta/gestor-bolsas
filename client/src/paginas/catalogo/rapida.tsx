import { useState } from "react";
import { dinero, numero } from "../../lib/formato";
import { costoBolsa, precioSugerido, redondearPrecio } from "../../lib/calculo";

function n(v: string) {
  const x = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

/** Calculadora para probar números sin guardar nada (ej. presupuestar un modelo nuevo). */
export function CalculadoraRapida({ precioMetro, margen }: { precioMetro: number; margen: number }) {
  const [metro, setMetro] = useState(precioMetro ? String(precioMetro) : "");
  const [metros, setMetros] = useState("0,5");
  const [otros, setOtros] = useState("");
  const [m, setM] = useState(String(margen));
  const [cantidad, setCantidad] = useState("1");

  const costo = costoBolsa(n(metro), n(metros), n(otros));
  const sugerido = redondearPrecio(precioSugerido(costo, n(m)));
  const ganancia = sugerido - costo;
  const cant = Math.max(1, Math.round(n(cantidad)));

  return (
    <section className="tarjeta space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="font-semibold text-stone-900">2. Calculadora rápida</h2>
        <p className="text-sm text-stone-500">Para presupuestar un modelo nuevo o un pedido especial. No guarda nada.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="$ metro de lienzo" valor={metro} set={setMetro} />
        <Campo etiqueta="Metros por bolsa" valor={metros} set={setMetros} />
        <Campo etiqueta="Otros costos por bolsa ($)" valor={otros} set={setOtros} ayuda="Hilo, manijas, estampa, tu tiempo…" />
        <Campo etiqueta="Margen deseado (%)" valor={m} set={setM} />
        <Campo etiqueta="Cantidad de bolsas" valor={cantidad} set={setCantidad} />
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-marca-50 p-3 text-center">
        <Resultado etiqueta="Costo x bolsa" valor={dinero(costo)} />
        <Resultado etiqueta="Precio sugerido" valor={dinero(sugerido)} destacado />
        <Resultado etiqueta="Ganás x bolsa" valor={dinero(ganancia)} />
      </div>
      {cant > 1 && sugerido > 0 && (
        <p className="text-center text-sm text-stone-600">
          {numero(cant, 0)} bolsas: cobrás <strong>{dinero(sugerido * cant)}</strong>, te cuestan {dinero(costo * cant)} y ganás{" "}
          <strong className="text-emerald-700">{dinero(ganancia * cant)}</strong>. Lienzo necesario: {numero(n(metros) * cant)} m.
        </p>
      )}
    </section>
  );
}

function Campo({ etiqueta, valor, set, ayuda }: { etiqueta: string; valor: string; set: (v: string) => void; ayuda?: string }) {
  return (
    <label className="block">
      <span className="etiqueta">{etiqueta}</span>
      <input inputMode="decimal" value={valor} onChange={(e) => set(e.target.value)} className="campo" />
      {ayuda && <span className="ayuda block">{ayuda}</span>}
    </label>
  );
}

function Resultado({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{etiqueta}</p>
      <p className={`mt-0.5 font-bold tabular-nums ${destacado ? "text-lg text-marca-700" : "text-stone-900"}`}>{valor}</p>
    </div>
  );
}
