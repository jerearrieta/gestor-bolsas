import express from "express";
import cors from "cors";
import { requiereUsuario } from "./supabase.js";
import { manejarErrores } from "./lib/errores.js";
import { ajustes } from "./rutas/ajustes.js";
import { productos } from "./rutas/productos.js";
import { clientes } from "./rutas/clientes.js";
import { pedidos } from "./rutas/pedidos.js";
import { finanzas } from "./rutas/finanzas.js";

export function crearApp() {
  const app = express();
  const origenes = (process.env.CLIENT_URL ?? "http://localhost:5173").split(",").map((o) => o.trim());

  app.use(cors({ origin: origenes }));
  app.use(express.json({ limit: "200kb" }));

  app.get("/api/salud", (_req, res) => {
    res.json({ ok: true });
  });

  const api = express.Router();
  api.use(requiereUsuario);
  api.use("/ajustes", ajustes);
  api.use("/productos", productos);
  api.use("/clientes", clientes);
  api.use("/pedidos", pedidos);
  api.use("/", finanzas);
  app.use("/api", api);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada." });
  });
  app.use(manejarErrores);
  return app;
}
