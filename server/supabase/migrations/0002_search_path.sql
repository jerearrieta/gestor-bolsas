-- Fija el search_path de las funciones (aviso de seguridad de Supabase).
-- Ambas usan nombres completos (public.productos, auth.uid()), así que no cambia su comportamiento.
alter function public.aumentar_precios(numeric, numeric) set search_path = '';
alter function public.tocar_actualizado_en() set search_path = '';
