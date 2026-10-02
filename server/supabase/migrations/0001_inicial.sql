-- =============================================================
-- JFA Bolsas · Esquema inicial
-- Pegá este archivo completo en Supabase > SQL Editor > Run.
-- Cada fila pertenece al usuario que la creó (user_id) y las
-- políticas RLS impiden que otro usuario la vea o la modifique.
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- Ajustes del negocio (una fila por usuario)
-- -------------------------------------------------------------
create table if not exists public.ajustes (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nombre_negocio text not null default 'JFA Bolsas',
  precio_metro_lienzo numeric(12, 2) not null default 0 check (precio_metro_lienzo >= 0),
  margen_objetivo numeric(5, 2) not null default 50 check (margen_objetivo >= 0 and margen_objetivo < 100),
  prefijo_whatsapp text not null default '549',
  mensaje_listo text not null default
    'Hola {nombre}! 👋 Te escribimos de {negocio}. Tu pedido #{pedido} ya está listo 🎉. Total: {total}. Saldo pendiente: {saldo}. ¡Avisanos cuándo lo retirás o coordinamos el envío!',
  actualizado_en timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Catálogo de productos
-- -------------------------------------------------------------
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  descripcion text,
  precio numeric(12, 2) not null default 0 check (precio >= 0),
  -- Datos para la calculadora de costos
  metros_lienzo numeric(8, 3) not null default 0 check (metros_lienzo >= 0),
  otros_costos numeric(12, 2) not null default 0 check (otros_costos >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists productos_user_idx on public.productos (user_id, nombre);

-- -------------------------------------------------------------
-- Clientes
-- -------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text,
  email text,
  direccion text,
  localidad text,
  notas text,
  creado_en timestamptz not null default now()
);
create index if not exists clientes_user_idx on public.clientes (user_id, nombre);

-- -------------------------------------------------------------
-- Pedidos
-- -------------------------------------------------------------
do $$ begin
  create type public.estado_pedido as enum ('pendiente', 'en_produccion', 'listo', 'entregado', 'cancelado');
exception when duplicate_object then null; end $$;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  estado public.estado_pedido not null default 'pendiente',
  fecha date not null default current_date,
  fecha_entrega date,
  direccion_envio text,
  costo_envio numeric(12, 2) not null default 0 check (costo_envio >= 0),
  descuento numeric(12, 2) not null default 0 check (descuento >= 0),
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists pedidos_user_idx on public.pedidos (user_id, estado, fecha desc);
create index if not exists pedidos_cliente_idx on public.pedidos (cliente_id);

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  descripcion text not null,
  cantidad integer not null default 1 check (cantidad > 0),
  precio_unitario numeric(12, 2) not null default 0 check (precio_unitario >= 0),
  posicion integer not null default 0
);
create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);

-- -------------------------------------------------------------
-- Movimientos de dinero (ingresos y gastos)
-- -------------------------------------------------------------
do $$ begin
  create type public.tipo_movimiento as enum ('ingreso', 'gasto');
exception when duplicate_object then null; end $$;

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo public.tipo_movimiento not null,
  monto numeric(12, 2) not null check (monto > 0),
  categoria text not null default 'Otros',
  descripcion text,
  fecha date not null default current_date,
  pedido_id uuid references public.pedidos (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index if not exists movimientos_user_idx on public.movimientos (user_id, fecha desc);
create index if not exists movimientos_pedido_idx on public.movimientos (pedido_id);

-- -------------------------------------------------------------
-- Vista con totales de cada pedido (respeta RLS del usuario)
-- -------------------------------------------------------------
create or replace view public.pedidos_resumen
with (security_invoker = true) as
select
  p.*,
  c.nombre as cliente_nombre,
  c.telefono as cliente_telefono,
  coalesce(i.subtotal, 0) as subtotal,
  coalesce(i.unidades, 0) as unidades,
  greatest(coalesce(i.subtotal, 0) + p.costo_envio - p.descuento, 0) as total,
  coalesce(m.pagado, 0) as pagado,
  greatest(coalesce(i.subtotal, 0) + p.costo_envio - p.descuento, 0) - coalesce(m.pagado, 0) as saldo
from public.pedidos p
left join public.clientes c on c.id = p.cliente_id
left join lateral (
  select sum(pi.cantidad * pi.precio_unitario) as subtotal, sum(pi.cantidad) as unidades
  from public.pedido_items pi
  where pi.pedido_id = p.id
) i on true
left join lateral (
  select sum(mv.monto) as pagado
  from public.movimientos mv
  where mv.pedido_id = p.id and mv.tipo = 'ingreso'
) m on true;

-- -------------------------------------------------------------
-- Fechas de actualización automáticas
-- -------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists productos_actualizado on public.productos;
create trigger productos_actualizado before update on public.productos
  for each row execute function public.tocar_actualizado_en();

drop trigger if exists pedidos_actualizado on public.pedidos;
create trigger pedidos_actualizado before update on public.pedidos
  for each row execute function public.tocar_actualizado_en();

drop trigger if exists ajustes_actualizado on public.ajustes;
create trigger ajustes_actualizado before update on public.ajustes
  for each row execute function public.tocar_actualizado_en();

-- -------------------------------------------------------------
-- Aumento masivo de precios (ej. +10% a todo el catálogo)
-- -------------------------------------------------------------
create or replace function public.aumentar_precios(porcentaje numeric, redondeo numeric default 1)
returns integer
language plpgsql
security invoker
as $$
declare
  filas integer;
begin
  if porcentaje <= -100 then
    raise exception 'El porcentaje no puede ser menor o igual a -100';
  end if;
  update public.productos
     set precio = case
       when coalesce(redondeo, 0) > 0
         then round(precio * (1 + porcentaje / 100) / redondeo) * redondeo
       else round(precio * (1 + porcentaje / 100), 2)
     end
   where user_id = auth.uid() and activo;
  get diagnostics filas = row_count;
  return filas;
end $$;

-- -------------------------------------------------------------
-- Seguridad: cada usuario sólo ve y modifica sus propios datos
-- -------------------------------------------------------------
alter table public.ajustes enable row level security;
alter table public.productos enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.movimientos enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['ajustes', 'productos', 'clientes', 'pedidos', 'pedido_items', 'movimientos'] loop
    execute format('drop policy if exists "dueño" on public.%I', t);
    execute format(
      'create policy "dueño" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;

grant select on public.pedidos_resumen to authenticated;
grant execute on function public.aumentar_precios(numeric, numeric) to authenticated;
