# JFA Bolsas · Sistema de gestión

App web para administrar el taller de bolsas de lienzo: pedidos, clientes, catálogo y precios, finanzas, calculadora de costos y avisos por WhatsApp. Funciona en el celular y en la compu.

El proyecto está dividido en dos carpetas:

| Carpeta | Qué tiene | Tecnología |
| --- | --- | --- |
| [`client/`](client) | Todo el front: pantallas, navegación, formularios y estilos. | React 19 + Vite + Tailwind CSS 4 + React Router |
| [`server/`](server) | Todo lo de servidor: API REST con la lógica del negocio (cálculo de precios, totales, saldos, mensajes de WhatsApp), validaciones y el esquema de la base de datos. | Node.js + Express 5 + Supabase (Postgres) |

```
Navegador ──(login)──► Supabase Auth
    │
    └──(token)──► server/ API Express ──► Supabase (Postgres con RLS)
```

El front sólo usa Supabase para iniciar sesión. Todos los datos pasan por la API, que verifica el token del usuario y consulta la base **como ese usuario**, así las reglas de seguridad (RLS) garantizan que cada cuenta vea sólo sus datos. Todo entra en los planes gratuitos de Supabase y Vercel.

## Qué hace

| Sección | Para qué sirve |
| --- | --- |
| **Inicio** | Ingresos, gastos y ganancia del mes, plata por cobrar, pedidos listos (con botón para avisar por WhatsApp), próximas entregas y alerta de pedidos atrasados. |
| **Pedidos** | Cargar pedidos con varios productos, envío, descuento y seña. Seguir el avance (Pendiente → En producción → Listo → Entregado), registrar pagos y ver cuánto falta cobrar. Se puede crear el cliente desde el mismo pedido. |
| **Clientes** | Directorio con teléfono, email, dirección de envío y notas. Historial de pedidos, total comprado y deuda de cada cliente. Botones para escribir por WhatsApp o llamar. |
| **Catálogo** | Lista de productos con cambio de precio en un toque y **aumento masivo** (ej. +10% con redondeo a $50). Muestra el margen real de cada bolsa. |
| **Calculadora** | Ponés cuánto cuesta el metro de lienzo y el margen que querés ganar; en cada bolsa cargás sus metros de lienzo y otros costos y ves al instante el **precio de venta sugerido** (con botón “Aplicar”). |
| **Finanzas** | Ingresos y gastos por mes, ganancia real y en qué categorías se fue la plata. Los pagos de pedidos se suman solos. |
| **WhatsApp** | Botón “Avisar que el pedido está listo” que abre WhatsApp (web o app) con el mensaje ya escrito, usando enlaces gratuitos `wa.me`. El mensaje se edita en **Ajustes**. |

### Cómo calcula el precio sugerido

```
costo por bolsa = metros de lienzo × precio del metro + otros costos (hilo, manijas, estampado, tu tiempo…)
precio sugerido = costo ÷ (1 − margen)        → redondeado hacia arriba a $10
```

Ejemplo: lienzo a $4.000 el metro, bolsa de 0,5 m y $800 de otros costos → costo $2.800. Con 50% de margen el precio sugerido es $5.600 (de cada $5.600, $2.800 son ganancia).

### Teléfonos

Cargá los números como los anotás normalmente (`11 2345 6789`, `011 15-2345-6789`, `+54 9 11…`). El servidor los convierte al formato de WhatsApp (`5491123456789`), sacando el 0 y el 15. Para otro país, cambiá el código en **Ajustes**.

---

## Puesta en marcha

### 1. Crear la base de datos en Supabase

1. Entrá a [supabase.com](https://supabase.com), creá una cuenta y un **New project** (plan Free). Elegí la región más cercana (ej. São Paulo).
2. Abrí **SQL Editor → New query**, pegá todo el contenido de [`server/supabase/migrations/0001_inicial.sql`](server/supabase/migrations/0001_inicial.sql) y tocá **Run**. Crea las tablas, la seguridad (cada usuario sólo ve sus datos) y las funciones.
3. Creá tu usuario: **Authentication → Users → Add user → Create new user**, con tu email y una contraseña, marcando **Auto Confirm User**.
4. Recomendado: en **Authentication → Sign In / Providers → Email**, desactivá **Allow new users to sign up** para que nadie más pueda registrarse.
5. En **Project Settings → API** copiá la **Project URL** y la **anon / publishable key**.

### 2. Correr todo en tu compu

Necesitás [Node.js](https://nodejs.org) 22 o superior.

```bash
npm install            # herramientas de la raíz
npm run instalar       # instala client/ y server/

cp server/.env.example server/.env              # completá SUPABASE_URL y SUPABASE_ANON_KEY
cp client/.env.example client/.env.local        # completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

npm run dev            # levanta la API (puerto 4000) y el front (puerto 5173) juntos
```

Abrí <http://localhost:5173> e ingresá con el usuario que creaste.

### 3. Publicarla en internet (Vercel, gratis)

Se crean **dos proyectos** en Vercel a partir del mismo repositorio:

**API (server)**
1. [vercel.com](https://vercel.com) → **Add New → Project** → importá el repositorio.
2. En **Root Directory** elegí `server`.
3. En **Environment Variables** agregá `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `CLIENT_URL` (la dirección del front, la vas a tener en el paso siguiente; podés volver a editarla después).
4. **Deploy**. Anotá la URL (ej. `https://gestor-bolsas-api.vercel.app`) y probala abriendo `/api/salud`.

**Front (client)**
1. **Add New → Project** → el mismo repositorio, **Root Directory** `client` (Vercel detecta Vite solo).
2. Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_API_URL` (la URL de la API del paso anterior).
3. **Deploy**. Después, volvé al proyecto de la API, poné esta URL en `CLIENT_URL` y redeployá la API.

Tip: en el celular, abrí la URL del front y elegí “Agregar a pantalla de inicio” para usarla como una app.

---

## Para desarrolladores

```bash
npm run dev     # client + server en modo desarrollo
npm run build   # compila server (tsc) y client (vite build)
npm test        # pruebas del server (teléfonos y cálculo de precios)
```

**server/**
- `src/app.ts` — arma la app Express y monta las rutas bajo `/api`.
- `src/supabase.ts` — valida el token `Authorization: Bearer …` y crea un cliente de Supabase con la identidad del usuario.
- `src/rutas/` — `ajustes`, `productos` (incluye `/aumento`), `clientes`, `pedidos` (incluye `/:id/estado` y `/:id/pagos`) y `finanzas` (`/finanzas`, `/movimientos`, `/inicio`).
- `src/lib/` — cálculo de precios, normalización de teléfonos y enlaces de WhatsApp, validaciones (zod) y manejo de errores.
- `supabase/migrations/` — esquema SQL. La vista `pedidos_resumen` calcula total, pagado y saldo de cada pedido.

**client/**
- `src/paginas/` — una carpeta o archivo por sección.
- `src/lib/api.ts` — cliente de la API (agrega el token y traduce errores).
- `src/lib/datos.ts` — `useDatos` (cargar datos) y `useEnvio` (enviar formularios).
- `src/components/` — navegación, botones y piezas de interfaz.

**Supabase local (opcional):** con Docker instalado, `cd server && npx supabase start` levanta una base local con la migración aplicada; usá la URL y la `ANON_KEY` que muestra.
