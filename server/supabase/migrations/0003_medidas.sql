-- =============================================================
-- Medidas: cada producto (Marinera, Totebag…) tiene varias medidas,
-- cada una con su precio y sus datos para la calculadora de costos.
-- =============================================================

create table if not exists public.producto_medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_id uuid not null references public.productos (id) on delete cascade,
  medida text not null default '',
  precio numeric(12, 2) not null default 0 check (precio >= 0),
  metros_lienzo numeric(8, 3) not null default 0 check (metros_lienzo >= 0),
  otros_costos numeric(12, 2) not null default 0 check (otros_costos >= 0),
  posicion integer not null default 0
);
create index if not exists producto_medidas_producto_idx on public.producto_medidas (producto_id, posicion);

alter table public.producto_medidas enable row level security;
drop policy if exists "dueño" on public.producto_medidas;
create policy "dueño" on public.producto_medidas for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Los productos que ya existían pasan a tener una sola medida con su precio y costos.
insert into public.producto_medidas (user_id, producto_id, medida, precio, metros_lienzo, otros_costos)
select p.user_id, p.id, '', p.precio, p.metros_lienzo, p.otros_costos
from public.productos p
where not exists (select 1 from public.producto_medidas m where m.producto_id = p.id);

-- Precio, metros y otros costos ahora viven en cada medida. Las columnas viejas de productos
-- quedan sin uso (no se borran para no romper la versión publicada mientras se actualiza).

-- Cada ítem de pedido puede recordar de qué medida salió.
alter table public.pedido_items
  add column if not exists medida_id uuid references public.producto_medidas (id) on delete set null;

-- El aumento masivo ahora actualiza el precio de cada medida de los productos activos.
create or replace function public.aumentar_precios(porcentaje numeric, redondeo numeric default 1)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  filas integer;
begin
  if porcentaje <= -100 then
    raise exception 'El porcentaje no puede ser menor o igual a -100';
  end if;
  update public.producto_medidas m
     set precio = case
       when coalesce(redondeo, 0) > 0
         then round(m.precio * (1 + porcentaje / 100) / redondeo) * redondeo
       else round(m.precio * (1 + porcentaje / 100), 2)
     end
    from public.productos p
   where p.id = m.producto_id and p.activo and m.user_id = (select auth.uid());
  get diagnostics filas = row_count;
  return filas;
end $$;
