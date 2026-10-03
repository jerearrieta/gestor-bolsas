-- =============================================================
-- Descuento en porcentaje: el pedido recuerda si el descuento se cargó
-- como % (ej. 10%) o como monto fijo. La columna `descuento` sigue
-- guardando el monto en $ que se resta del total.
-- =============================================================

alter table public.pedidos
  add column if not exists descuento_porcentaje numeric(5, 2)
  check (descuento_porcentaje is null or (descuento_porcentaje > 0 and descuento_porcentaje <= 100));

-- La vista usa p.*, así que hay que recrearla para que incluya la columna nueva.
drop view if exists public.pedidos_resumen;
create view public.pedidos_resumen
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

grant select on public.pedidos_resumen to authenticated;
