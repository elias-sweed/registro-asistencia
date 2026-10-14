-- =============================================================
--  ELIMINAR UNA CUENTA (practicante o docente)
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  Se puede ejecutar varias veces sin romper nada.
-- =============================================================

-- Al borrar la cuenta de autenticacion, las tablas que la apuntan se
-- borran solas por ON DELETE CASCADE:
--   auth.users -> public.practicantes  -> public.asistencias
--   auth.users -> public.registros_realizados
-- Asi desaparece tambien el registro de asistencia de esa persona.
create or replace function public.eliminar_cuenta(p_correo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_busqueda text := lower(btrim(coalesce(p_correo, '')));
  v_id uuid;
begin
  if not exists (
    select 1 from public.administradores
     where lower(correo) = v_email and activo
  ) then
    raise exception 'NO_ADMIN';
  end if;

  if v_busqueda = '' then
    raise exception 'CORREO_VACIO';
  end if;

  select id into v_id from auth.users where lower(email) = v_busqueda limit 1;

  if v_id is null then
    raise exception 'NO_EXISTE';
  end if;

  delete from auth.users where id = v_id;

  return true;
end;
$$;

revoke execute on function public.eliminar_cuenta(text) from public, anon;
grant execute on function public.eliminar_cuenta(text) to authenticated;

-- Corregir la fecha y hora de una asistencia --------------------
-- Para cuando alguien se olvidó de marcar y hay que ponerla a mano.
-- Solo el administrador, y queda anotado que fue corregida.
create or replace function public.corregir_fecha_registro(
  p_correo text,
  p_fecha  timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_busqueda text := lower(btrim(coalesce(p_correo, '')));
begin
  if not exists (
    select 1 from public.administradores
     where lower(correo) = v_email and activo
  ) then
    raise exception 'NO_ADMIN';
  end if;

  if v_busqueda = '' or p_fecha is null then
    raise exception 'DATOS_INVALIDOS';
  end if;

  if not exists (select 1 from public.asistencias where lower(correo) = v_busqueda) then
    raise exception 'NO_REGISTRO';
  end if;

  update public.asistencias
     set fecha = p_fecha
   where lower(correo) = v_busqueda;

  update public.registros_realizados
     set fecha = p_fecha
   where practicante_id in (
     select id from public.practicantes where lower(correo) = v_busqueda
   );

  return true;
end;
$$;

revoke execute on function public.corregir_fecha_registro(text, timestamptz) from public, anon;
grant execute on function public.corregir_fecha_registro(text, timestamptz) to authenticated;

-- COMPROBACION: después de borrar una cuenta puedes ver que ya no está.
-- select correo from auth.users order by correo;