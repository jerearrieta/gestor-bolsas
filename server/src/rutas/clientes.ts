import { Router } from "express";
import { z } from "zod";
import { sesion } from "../supabase.js";
import { obtenerAjustes } from "../lib/ajustes.js";
import { noEncontrado, siFalla } from "../lib/errores.js";
import { texto } from "../lib/esquemas.js";
import { enlaceWhatsApp, normalizarTelefono } from "../lib/whatsapp.js";

export const clientes = Router();

clientes.get("/", async (req, res) => {
  const { supabase } = sesion(res);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  let consulta = supabase.from("clientes").select("*").order("nombre");
  if (q) {
    const patron = `%${q.replace(/[%_,()]/g, " ")}%`;
    consulta = consulta.or(`nombre.ilike.${patron},telefono.ilike.${patron},localidad.ilike.${patron},email.ilike.${patron}`);
  }
  const [{ data, error }, { data: pedidos }] = await Promise.all([
    consulta,
    supabase.from("pedidos_resumen").select("cliente_id, total, estado").neq("estado", "cancelado"),
  ]);
  siFalla(error, "No se pudieron leer los clientes");
  const stats = new Map<string, { pedidos: number; total: number }>();
  for (const p of pedidos ?? []) {
    if (!p.cliente_id) continue;
    const s = stats.get(p.cliente_id) ?? { pedidos: 0, total: 0 };
    s.pedidos += 1;
    s.total += Number(p.total);
    stats.set(p.cliente_id, s);
  }
  res.json((data ?? []).map((c) => ({ ...c, pedidos: stats.get(c.id)?.pedidos ?? 0, total_comprado: stats.get(c.id)?.total ?? 0 })));
});

clientes.get("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const id = req.params.id;
  const [{ data: cliente }, { data: pedidos }, ajustes] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
    supabase.from("pedidos_resumen").select("*").eq("cliente_id", id).order("fecha", { ascending: false }),
    obtenerAjustes(supabase),
  ]);
  if (!cliente) throw noEncontrado("Cliente");
  const validos = (pedidos ?? []).filter((p) => p.estado !== "cancelado");
  const primerNombre = cliente.nombre.split(" ")[0];
  res.json({
    cliente,
    pedidos: pedidos ?? [],
    total_comprado: validos.reduce((s, p) => s + Number(p.total), 0),
    deuda: validos.reduce((s, p) => s + Math.max(Number(p.saldo), 0), 0),
    whatsapp: enlaceWhatsApp(cliente.telefono, `Hola ${primerNombre}! Te escribimos de ${ajustes.nombre_negocio}. `, ajustes.prefijo_whatsapp),
    telefono_internacional: normalizarTelefono(cliente.telefono, ajustes.prefijo_whatsapp),
  });
});

const esquemaCliente = z.object({
  nombre: z.string().trim().min(1, { error: "El nombre es obligatorio." }),
  telefono: texto.optional(),
  email: texto.optional(),
  direccion: texto.optional(),
  localidad: texto.optional(),
  notas: texto.optional(),
});

clientes.post("/", async (req, res) => {
  const { supabase } = sesion(res);
  const { data, error } = await supabase.from("clientes").insert(esquemaCliente.parse(req.body)).select("id").single();
  siFalla(error, "No se pudo crear el cliente");
  res.status(201).json(data);
});

clientes.put("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const { error } = await supabase.from("clientes").update(esquemaCliente.parse(req.body)).eq("id", req.params.id);
  siFalla(error, "No se pudo guardar el cliente");
  res.json({ id: req.params.id });
});

clientes.delete("/:id", async (req, res) => {
  const { supabase } = sesion(res);
  const { error } = await supabase.from("clientes").delete().eq("id", req.params.id);
  siFalla(error, "No se pudo borrar el cliente");
  res.status(204).end();
});
