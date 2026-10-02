import { Router } from "express";
import { z } from "zod";
import { sesion } from "../supabase.js";
import { obtenerAjustes } from "../lib/ajustes.js";
import { siFalla } from "../lib/errores.js";
import { fecha, monto, texto } from "../lib/esquemas.js";
import { hoyISO, rangoMes } from "../lib/formato.js";
import { avisoPedidoListo } from "../lib/mensajes.js";

export const finanzas = Router();

function totales(movs: { tipo: string; monto: number | string }[]) {
  const ingresos = movs.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const gastos = movs.filter((m) => m.tipo === "gasto").reduce((s, m) => s + Number(m.monto), 0);
  return { ingresos, gastos, ganancia: ingresos - gastos };
}

/** Resumen del mes: ingresos, gastos, ganancia real, por cobrar y gastos por categoría. */
finanzas.get("/finanzas", async (req, res) => {
  const { supabase } = sesion(res);
  const hoy = hoyISO();
  const mes = typeof req.query.mes === "string" && /^\d{4}-\d{2}$/.test(req.query.mes) ? req.query.mes : hoy.slice(0, 7);
  const { desde, hasta } = rangoMes(mes);
  const [{ data, error }, { data: pendientes }] = await Promise.all([
    supabase
      .from("movimientos")
      .select("*")
      .gte("fecha", desde)
      .lt("fecha", hasta)
      .order("fecha", { ascending: false })
      .order("creado_en", { ascending: false }),
    supabase.from("pedidos_resumen").select("saldo").neq("estado", "cancelado").gt("saldo", 0),
  ]);
  siFalla(error, "No se pudieron leer los movimientos");
  const movimientos = data ?? [];
  const t = totales(movimientos);
  const categorias = new Map<string, number>();
  for (const m of movimientos) if (m.tipo === "gasto") categorias.set(m.categoria, (categorias.get(m.categoria) ?? 0) + Number(m.monto));

  res.json({
    mes,
    mes_actual: hoy.slice(0, 7),
    hoy,
    ...t,
    margen: t.ingresos > 0 ? (t.ganancia / t.ingresos) * 100 : null,
    por_cobrar: (pendientes ?? []).reduce((s, p) => s + Number(p.saldo), 0),
    gastos_por_categoria: [...categorias.entries()].sort((a, b) => b[1] - a[1]).map(([categoria, total]) => ({ categoria, total })),
    movimientos,
  });
});

finanzas.post("/movimientos", async (req, res) => {
  const { supabase } = sesion(res);
  const datos = z
    .object({
      tipo: z.enum(["ingreso", "gasto"]),
      monto: monto.refine((v) => v > 0, { error: "Ingresá un monto mayor a 0." }),
      categoria: z.string().trim().min(1).default("Otros"),
      descripcion: texto.optional(),
      fecha: fecha.optional(),
    })
    .parse(req.body);
  const { error } = await supabase.from("movimientos").insert({ ...datos, fecha: datos.fecha ?? hoyISO() });
  siFalla(error, "No se pudo guardar el movimiento");
  res.status(201).json({ ok: true });
});

finanzas.delete("/movimientos/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const { error } = await supabase.from("movimientos").delete().eq("id", req.params.id);
  siFalla(error, "No se pudo borrar el movimiento");
  res.status(204).end();
});

/** Todo lo que muestra la pantalla de inicio. */
finanzas.get("/inicio", async (_req, res) => {
  const { supabase } = sesion(res);
  const hoy = hoyISO();
  const { desde, hasta } = rangoMes(hoy.slice(0, 7));
  const [{ data: activos }, { data: movs }, ajustes] = await Promise.all([
    supabase
      .from("pedidos_resumen")
      .select("*")
      .in("estado", ["pendiente", "en_produccion", "listo"])
      .order("fecha_entrega", { ascending: true, nullsFirst: false }),
    supabase.from("movimientos").select("tipo, monto").gte("fecha", desde).lt("fecha", hasta),
    obtenerAjustes(supabase),
  ]);
  const lista = activos ?? [];
  const enCurso = lista.filter((p) => p.estado !== "listo");
  res.json({
    hoy,
    negocio: ajustes.nombre_negocio,
    ...totales(movs ?? []),
    por_cobrar: lista.reduce((s, p) => s + Math.max(Number(p.saldo), 0), 0),
    pedidos_activos: lista.length,
    conteos: {
      pendiente: lista.filter((p) => p.estado === "pendiente").length,
      en_produccion: lista.filter((p) => p.estado === "en_produccion").length,
      listo: lista.filter((p) => p.estado === "listo").length,
    },
    listos: lista.filter((p) => p.estado === "listo").map((p) => ({ ...p, whatsapp: avisoPedidoListo(p, ajustes) })),
    en_curso: enCurso.slice(0, 6),
    atrasados: enCurso.filter((p) => p.fecha_entrega && p.fecha_entrega < hoy).map((p) => p.numero),
  });
});
