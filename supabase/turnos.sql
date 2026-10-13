-- =============================================================
--  TURNOS: MANANA y TARDE
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  (ejecuta este archivo DESPUES de schema.sql y por-cuenta.sql)
-- =============================================================

-- 1) Agregar MANANA al enum de turno ---------------------------
alter type public.turno add value if not exists 'MANANA';

-- 2) Recargar la funcion registrar_asistencia con p_turno -----
--    (se recrea porque una firma nueva necesita permisos nuevos)
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, timestamptz);

create or replace function public.registrar_asistencia(
  p_nombres   text,
  p_apellidos text,
  p_programa  public.programa,
  p_ciclo     smallint,
  p_turno     public.turno,
  p_fecha     timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_correo text;
  v_ciclo  smallint;
  v_turno  public.turno;
begin
  if v_uid is null then
    raise exception 'NO_AUTENTICADO';
  end if;

  select email into v_correo from auth.users where id = v_uid;
  if v_correo is null then
    raise exception 'NO_AUTENTICADO';
  end if;

  if char_length(btrim(coalesce(p_nombres, ''))) < 2
     or char_length(btrim(coalesce(p_apellidos, ''))) < 2
     or p_programa is null then
    raise exception 'CAMPOS_OBLIGATORIOS';
  end if;

  -- El turno es obligatorio y solo puede ser MANANA o TARDE.
  if p_turno is null or p_turno not in ('MANANA', 'TARDE') then
    raise exception 'TURNO_INVALIDO';
  end if;

  -- Una sola vez por cuenta.
  if exists (select 1 from public.registros_realizados where practicante_id = v_uid) then
    raise exception 'YA_REGISTRADO';
  end if;

  v_ciclo := case when p_programa = 'DOCENTE_API' then null else coalesce(p_ciclo, 1) end;
  v_turno := p_turno;

  begin
    insert into public.registros_realizados (practicante_id, nombres, apellidos, fecha)
    values (v_uid, btrim(p_nombres), btrim(p_apellidos));
  exception when unique_violation then
    raise exception 'YA_REGISTRADO';
  end;

  insert into public.asistencias
    (practicante_id, correo, nombres, apellidos, programa, ciclo, turno, asistio, fecha)
  values
    (v_uid, v_correo, btrim(p_nombres), btrim(p_apellidos),
     p_programa, v_ciclo, v_turno, true, coalesce(p_fecha, now()));

  update public.practicantes
     set nombres        = btrim(p_nombres),
         apellidos       = btrim(p_apellidos),
         programa       = p_programa,
         ciclo          = v_ciclo,
         turno          = v_turno,
         actualizado_en = now()
   where id = v_uid;

  return v_uid;
end;
$$;

revoke execute on function public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz) from public, anon;
grant execute on function public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz) to authenticated;