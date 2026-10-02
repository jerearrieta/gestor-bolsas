import type { Express } from "express";
import { crearApp } from "./crear-app.js";

// Vercel toma como entrada el primer archivo (app, index, server…) que importa express,
// por eso la app se arma en crear-app.ts y este archivo es el único punto de entrada.
const app: Express = crearApp();

// En Vercel la app se exporta y corre como función; en local escucha en un puerto.
if (!process.env.VERCEL) {
  const puerto = Number(process.env.PORT ?? 4000);
  app.listen(puerto, () => {
    console.log(`API de JFA Bolsas en http://localhost:${puerto}`);
  });
}

export default app;
