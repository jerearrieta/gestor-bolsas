# JFA Bolsas · Sistema de gestión

App web para administrar el taller de bolsas de lienzo: pedidos, clientes, catálogo y precios, finanzas, calculadora de costos y avisos por WhatsApp. Funciona en el celular y en la compu.

Hecha con **Next.js 16** (App Router, TypeScript), **Tailwind CSS 4** y **Supabase** (base de datos + login). Entra completa en el plan gratuito de Supabase y de Vercel.

## Qué hace

| Sección | Para qué sirve |
| --- | --- |
| **Inicio** | Ingresos, gastos y ganancia del mes, plata por cobrar, pedidos listos (con botón para avisar por WhatsApp), próximas entregas y alerta de pedidos atrasados. |
| **Pedidos** | Cargar pedidos con varios productos, envío, descuento y seña. Seguir el avance (Pendiente → En producción → Listo → Entregado), registrar pagos y ver cuánto falta cobrar. Se puede crear el cliente desde el mismo pedido. |
| **Clientes** | Directorio con teléfono, email, dirección de envío y notas. Historial de pedidos, total comprado y deuda de cada cliente. Botones para escribir por WhatsApp o llamar. |
| **Catálogo** | Lista de productos con cambio de precio en un toque y **aumento masivo** (ej. +10% con redondeo a $50). Muestra el margen real de cada bolsa. |
| **Calculadora** | Ponés cuánto cuesta el metro de lienzo y el margen que querés ganar, y calcula el costo y el **precio de venta sugerido** de cada bolsa (con botón “Aplicar”). Incluye una calculadora rápida para presupuestar. |
| **Finanzas** | Ingresos y gastos por mes, ganancia real y en qué categorías se fue la plata. Los pagos de pedidos se suman solos. |
| **WhatsApp** | Botón “Avisar que el pedido está listo” que abre WhatsApp (web o app) con el mensaje ya escrito, usando enlaces gratuitos `wa.me`. El mensaje se edita en **Ajustes**. |

### Cómo calcula el precio sugerido

```
costo por bolsa = metros de lienzo × precio del metro + otros costos (hilo, manijas, estampado, tu tiempo…)
precio sugerido = costo ÷ (1 − margen)        → redondeado hacia arriba a $10
```

Ejemplo: lienzo a $4.000 el metro, bolsa de 0,5 m y $800 de otros costos → costo $2.800. Con 50% de margen el precio sugerido es $5.600 (de cada $5.600, $2.800 son ganancia).

### Teléfonos

Cargá los números como los anotás normalmente (`11 2345 6789`, `011 15-2345-6789`, `+54 9 11…`). La app los convierte al formato de WhatsApp (`5491123456789`), sacando el 0 y el 15. Para otro país, cambiá el código en **Ajustes**.

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com), creá una cuenta y un **New project** (plan Free). Elegí la región más cercana (ej. São Paulo).
2. Abrí **SQL Editor → New query**, pegá todo el contenido de [`supabase/migrations/0001_inicial.sql`](supabase/migrations/0001_inicial.sql) y tocá **Run**. Crea las tablas, la seguridad (cada usuario sólo ve sus datos) y las funciones.
3. Creá tu usuario: **Authentication → Users → Add user → Create new user**, con tu email y una contraseña, marcando **Auto Confirm User**.
4. Recomendado: en **Authentication → Sign In / Providers → Email**, desactivá **Allow new users to sign up** para que nadie más pueda registrarse.
5. En **Project Settings → API** copiá la **Project URL** y la **anon / publishable key**.

### 2. Correr la app en tu compu

Necesitás [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
cp .env.example .env.local   # y completá las dos variables con los datos del paso 1.5
npm run dev
```

Abrí <http://localhost:3000> e ingresá con el usuario que creaste.

### 3. Publicarla en internet (Vercel, gratis)

1. Subí este código a un repositorio de GitHub.
2. Entrá a [vercel.com](https://vercel.com) → **Add New → Project** → importá el repositorio.
3. En **Environment Variables** agregá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores.
4. **Deploy**. En un par de minutos tenés la URL (ej. `jfa-bolsas.vercel.app`).
5. Tip: en el celular, abrí la URL y elegí “Agregar a pantalla de inicio” para usarla como una app.

---

## Para desarrolladores

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run lint    # ESLint
```

- `src/app/(app)/` — pantallas (inicio, pedidos, clientes, catálogo, finanzas, ajustes). Cada módulo tiene su `actions.ts` con las Server Actions.
- `src/app/login/` — ingreso con email y contraseña (Supabase Auth).
- `src/proxy.ts` — refresca la sesión y redirige al login si no hay usuario.
- `src/lib/` — cliente de Supabase, formato de moneda/fechas, cálculo de precios y enlaces de WhatsApp.
- `supabase/migrations/` — esquema SQL. La vista `pedidos_resumen` calcula total, pagado y saldo de cada pedido.

**Supabase local (opcional):** con Docker instalado, `npx supabase start` levanta una base local con la migración aplicada; usá la URL y la `ANON_KEY` que muestra en `.env.local`.
