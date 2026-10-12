-- =============================================================
--  UN SOLO TURNO (TARDE)
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  Si la tabla esta vacia, mas simple usa schema.sql
-- =============================================================

-- 1) Quitar el turno MANANA de los registros existentes ---------
update public.asistencias set turno = 'TARDE'::public.turno where turno <> 'TARDE'::public.turno;
update public.practicantes set turno = 'TARDE'::public.turno where turno <> 'TARDE'::public.turno;

-- 2) Quitar lo que depende del enum ANTES de recrearlo -------
--    Primero la vista, luego la funcion vieja (su firma usa
--    public.turno y no permitiria hacer DROP TYPE).
drop view if exists public.vista_asistencias;
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz, text, smallint);

-- 3) Reemplazar el enum por uno de un solo valor ---------------
do $$
declare
  v_tiene_manana boolean;
begin
  select exists (
    select 1 from pg_enum
    join pg_type on pg_type.oid = pg_enum.enumtypid
    where pg_type.typname = 'turno'
      and pg_type.typnamespace = 'public'::regnamespace
      and enumlabel = 'MANANA'
  ) into v_tiene_manana;

  if v_tiene_manana then
    alter table public.asistencias
      alter column turno type text using 'TARDE'::text;
    alter table public.practicantes
      alter column turno type text using 'TARDE'::text;

    drop type public.turno;
    create type public.turno as enum ('TARDE');

    alter table public.asistencias
      alter column turno type public.turno using turno::public.turno;
    alter table public.practicantes
      alter column turno type public.turno using turno::public.turno;
  end if;
end $$;

-- 4) Turno unico por defecto -----------------------------------
alter table public.asistencias  alter column turno set default 'TARDE';
alter table public.practicantes alter column turno set default 'TARDE';

-- 5) Funcion de registro con el turno fijo --------------------
create or replace function public.registrar_asistencia(
  p_nombres   text,
  p_apellidos text,
  p_programa  public.programa,
  p_ciclo     smallint,
  p_fecha     timestamptz default now(),
  p_ip        text default null,
  p_hora      smallint default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_correo    text;
  v_ip        text;
  v_cabeceras text;
  v_ciclo     smallint;
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

  -- El registro se abre a las 12:00 (hora del dispositivo).
  if coalesce(p_hora, 0) < 12 then
    raise exception 'FUERA_DE_HORARIO';
  end if;

  v_ciclo := case when p_programa = 'DOCENTE_API' then null else coalesce(p_ciclo, 1) end;

  v_ip := nullif(btrim(coalesce(p_ip, '')), '');

  if v_ip is null then
    v_cabeceras := nullif(current_setting('request.headers', true), '');
    if v_cabeceras is not null and v_cabeceras <> '' then
      v_ip := nullif(btrim(coalesce(v_cabeceras::jsonb ->> 'x-forwarded-for', '')), '');
    end if;
  end if;

  if v_ip is not null then
    v_ip := btrim(split_part(v_ip, ',', 1));
  end if;

  if v_ip is null or v_ip = '' then
    v_ip := 'usuario:' || v_uid::text;
  end if;

  -- Una sola vez: por practicante (correo) y por IP
  if exists (select 1 from public.registros_ip where practicante_id = v_uid) then
    raise exception 'IP_YA_REGISTRADA';
  end if;

  begin
    insert into public.registros_ip (ip, correo, practicante_id)
    values (v_ip, v_correo, v_uid);
  exception when unique_violation then
    raise exception 'IP_YA_REGISTRADA';
  end;

  insert into public.asistencias
    (practicante_id, correo, nombres, apellidos, programa, ciclo, turno, asistio, fecha)
  values
    (v_uid, v_correo, btrim(p_nombres), btrim(p_apellidos),
     p_programa, v_ciclo, 'TARDE'::public.turno, true, coalesce(p_fecha, now()));

  update public.practicantes
     set nombres        = btrim(p_nombres),
         apellidos       = btrim(p_apellidos),
         programa       = p_programa,
         ciclo          = v_ciclo,
         turno          = 'TARDE'::public.turno,
         actualizado_en = now()
   where id = v_uid;

  return v_ip;
end;
$$;

revoke execute on function public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint) from public, anon;
grant execute on function public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint) to authenticated;

-- 6) Indice unico por practicante ------------------------------
create unique index if not exists registros_ip_usuario_unico
  on public.registros_ip (practicante_id)
  where practicante_id is not null;

-- 7) Vista de control (solo service_role) ---------------------
create or replace view public.vista_asistencias as
select
  a.id, a.correo, a.nombres, a.apellidos,
  a.programa, a.ciclo, a.turno, a.asistio, a.fecha,
  p.id as practicante_id
from public.asistencias a
join public.practicantes p on p.id = a.practicante_id;

revoke all on public.vista_asistencias from anon, authenticated;
grant select on public.vista_asistencias to service_role;