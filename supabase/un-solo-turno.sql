-- =============================================================
--  UN SOLO TURNO (TARDE)
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--
--  IMPORTANTE: ejecuta este archivo y DESPUES horario-8am.sql
--  (este libera la funcion para poder recrear el enum)
-- =============================================================

-- 1) Datos existentes: todo a TARDE
update public.asistencias  set turno = 'TARDE'::public.turno where turno <> 'TARDE'::public.turno;
update public.practicantes set turno = 'TARDE'::public.turno where turno <> 'TARDE'::public.turno;

-- 2) Quitar lo que depende del enum antes de recrearlo -------
drop view if exists public.vista_asistencias;
drop view if exists public.vista_registros_ip;
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, public.turno, timestamptz, text, smallint);
drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint, smallint);

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
alter table public.asistencias  alter column turno set not null;
alter table public.practicantes alter column turno drop not null;

-- 5) Recrear la vista de control (solo service_role) ----------
create or replace view public.vista_asistencias as
select
  a.id, a.correo, a.nombres, a.apellidos,
  a.programa, a.ciclo, a.turno, a.asistio, a.fecha,
  p.id as practicante_id
from public.asistencias a
join public.practicantes p on p.id = a.practicante_id;

revoke all on public.vista_asistencias from anon, authenticated;
grant select on public.vista_asistencias to service_role;

create or replace view public.vista_registros_ip as
select r.ip, r.correo, r.creado_en,
       coalesce(p.nombres, '') || ' ' || coalesce(p.apellidos, '') as practicante
from public.registros_ip r
left join public.practicantes p on p.id = r.practicante_id
order by r.creado_en desc;

revoke all on public.vista_registros_ip from anon, authenticated;
grant select on public.vista_registros_ip to service_role;