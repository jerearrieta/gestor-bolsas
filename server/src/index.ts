import { crearApp } from "./app.js";

const app = crearApp();

// En Vercel la app se exporta y corre como función; en local escucha en un puerto.
if (!process.env.VERCEL) {
  const puerto = Number(process.env.PORT ?? 4000);
  app.listen(puerto, () => {
    console.log(`API de JFA Bolsas en http://localhost:${puerto}`);
  });
}

export default app;
