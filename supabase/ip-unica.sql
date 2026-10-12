-- =============================================================
--  UNA SOLA ASISTENCIA POR DISPOSITIVO (IP)
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--
--  IMPORTANTE: asi el bloqueo se aplica en la base de datos, no
--  en el navegador. Aunque el practicante cambie de correo, de
--  navegador o de dispositivo dentro de la misma conexion, la
--  segunda registracion se rechaza con el error IP_YA_REGISTRADA.
-- =============================================================

-- 1) Tabla de IPs ya utilizadas ---------------------------------
create table if not exists public.registros_ip (
  ip              text primary key,
  correo          text not null,
  practicante_id  uuid references auth.users(id) on delete set null,
  creado_en       timestamptz not null default now()
);

comment on table public.registros_ip is 'Una fila por IP: impide un segundo registro';

create index if not exists registros_ip_practicante_idx
  on public.registros_ip (practicante_id);

-- 2) RLS: nadie escribe directo, solo la funcion de abajo ------
alter table public.registros_ip enable row level security;

drop policy if exists "registros_ip_select_own" on public.registros_ip;
create policy "registros_ip_select_own" on public.registros_ip
  for select using (auth.uid() = practicante_id);

revoke insert, update, delete on public.registros_ip from anon, authenticated;

-- 3) El ciclo queda opcional (para el rol Docente API) ---------
alter table public.asistencias alter column ciclo drop not null;

-- 4) Funcion de registro ---------------------------------------
--    Reemplaza la version anterior si ya se habia ejecutado.
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz, text);

create or replace function public.registrar_asistencia(
  p_nombres   text,
  p_apellidos text,
  p_programa  public.programa,
  p_ciclo     smallint,
  p_turno     public.turno,
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

  -- Datos obligatorios
  if char_length(btrim(coalesce(p_nombres, ''))) < 2
     or char_length(btrim(coalesce(p_apellidos, ''))) < 2
     or p_programa is null
     or p_turno is null then
    raise exception 'CAMPOS_OBLIGATORIOS';
  end if;

  -- Horario: el turno tarde solo marca a partir de las 12:00
  -- (la hora la envia el reloj del dispositivo).
  if p_turno = 'TARDE' and coalesce(p_hora, 0) < 12 then
    raise exception 'FUERA_DE_HORARIO';
  end if;

  v_ciclo := case when p_programa = 'DOCENTE_API' then null else coalesce(p_ciclo, 1) end;

  -- a) IP que reporta el navegador
  v_ip := nullif(btrim(coalesce(p_ip, '')), '');

  -- b) IP real de la peticion (respaldo si el navegador no pudo obtenerla)
  if v_ip is null then
    v_cabeceras := nullif(current_setting('request.headers', true), '');
    if v_cabeceras is not null and v_cabeceras <> '' then
      v_ip := nullif(btrim(coalesce(v_cabeceras::jsonb ->> 'x-forwarded-for', '')), '');
    end if;
  end if;

  if v_ip is not null then
    v_ip := btrim(split_part(v_ip, ',', 1));
  end if;

  -- c) Sin IP disponible: se usa el usuario como clave
  if v_ip is null or v_ip = '' then
    v_ip := 'usuario:' || v_uid::text;
  end if;

  -- d) Una sola vez por IP
  begin
    insert into public.registros_ip (ip, correo, practicante_id)
    values (v_ip, v_correo, v_uid);
  exception when unique_violation then
    raise exception 'IP_YA_REGISTRADA';
  end;

  -- e) Guardar la asistencia
  insert into public.asistencias
    (practicante_id, correo, nombres, apellidos, programa, ciclo, turno, asistio, fecha)
  values
    (v_uid, v_correo, btrim(p_nombres), btrim(p_apellidos),
     p_programa, v_ciclo, p_turno, true, coalesce(p_fecha, now()));

  -- f) Actualizar el perfil del practicante
  update public.practicantes
     set nombres      = btrim(p_nombres),
         apellidos     = btrim(p_apellidos),
         programa     = p_programa,
         ciclo        = v_ciclo,
         turno        = p_turno,
         actualizado_en = now()
   where id = v_uid;

  return v_ip;
end;
$$;

revoke execute on function public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz, text, smallint) from public, anon;
grant execute on function public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz, text, smallint) to authenticated;

-- g) Reporte de IPs usadas (solo service_role / dashboard)
create or replace view public.vista_registros_ip as
select ip, correo, creado_en
from public.registros_ip
order by creado_en desc;

revoke all on public.vista_registros_ip from anon, authenticated;
grant select on public.vista_registros_ip to service_role;