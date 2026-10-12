-- =============================================================
--  UN SOLO REGISTRO POR CUENTA (sin bloqueo por IP)
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  Se puede ejecutar varias veces sin romper nada.
-- =============================================================

-- 1) Quitar lo que dependa de la tabla de IP ---------------
drop view if exists public.vista_registros_ip;
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint, smallint);
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text);
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint);
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz, text, smallint);

drop table if exists public.registros_ip;

-- 2) Tabla de registros realizados (una fila por cuenta) ---
create table if not exists public.registros_realizados (
  practicante_id uuid primary key references auth.users(id) on delete cascade,
  nombres        text not null,
  apellidos       text not null,
  fecha          timestamptz not null default now()
);

comment on table public.registros_realizados is
  'Impide que una misma cuenta registre asistencia mas de una vez';

alter table public.registros_realizados enable row level security;

drop policy if exists "registros_realizados_lectura_propia" on public.registros_realizados;
create policy "registros_realizados_lectura_propia" on public.registros_realizados
  for select using (auth.uid() = practicante_id);

revoke insert, update, delete on public.registros_realizados from anon, authenticated;

-- 3) Migrar lo que ya se habia registrado --------------------
insert into public.registros_realizados (practicante_id, nombres, apellidos, fecha)
select a.practicante_id, a.nombres, a.apellidos, a.creado_en
from public.asistencias a
on conflict (practicante_id) do nothing;

-- 4) Funcion de registro (solo por cuenta) ------------------
create or replace function public.registrar_asistencia(
  p_nombres   text,
  p_apellidos text,
  p_programa  public.programa,
  p_ciclo     smallint,
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

  -- Una sola vez por cuenta.
  if exists (select 1 from public.registros_realizados where practicante_id = v_uid) then
    raise exception 'YA_REGISTRADO';
  end if;

  v_ciclo := case when p_programa = 'DOCENTE_API' then null else coalesce(p_ciclo, 1) end;

  begin
    insert into public.registros_realizados (practicante_id, nombres, apellidos)
    values (v_uid, btrim(p_nombres), btrim(p_apellidos));
  exception when unique_violation then
    raise exception 'YA_REGISTRADO';
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

  return v_uid;
end;
$$;

revoke execute on function public.registrar_asistencia(text, text, public.programa, smallint, timestamptz) from public, anon;
grant execute on function public.registrar_asistencia(text, text, public.programa, smallint, timestamptz) to authenticated;