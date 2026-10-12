-- =============================================================
--  MIGRACION: programas SENATI / UCV / DOCENTE_API
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  (si la base esta vacia tambien puedes(schema.sql)
-- =============================================================

-- 1) Tipo de programa ------------------------------------------------
do $$ begin
  create type public.programa as enum ('SENATI', 'UCV', 'DOCENTE_API');
exception when duplicate_object then null; end $$;

-- 2) Vista: hay que recrearla porque cambia la columna ciclo -----
drop view if exists public.vista_asistencias;

-- 3) Tabla practicanes: I..IV -> 1..10 --------------------------
alter table public.practicantes add column if not exists ciclo_num smallint;

update public.practicantes
   set ciclo_num = case ciclo::text
                      when 'I' then 1 when 'II' then 2
                      when 'III' then 3 when 'IV' then 4
                    end
 where ciclo_num is null and ciclo is not null;

alter table public.practicantes drop column if exists ciclo;
alter table public.practicantes rename column ciclo_num to ciclo;

alter table public.practicantes
  add column if not exists programa public.programa;

update public.practicantes set programa = 'SENATI' where programa is null;
alter table public.practicantes alter column programa set default 'SENATI';

do $$ begin
  alter table public.practicantes
    add constraint practicantes_ciclo_rango
    check (ciclo is null or ciclo between 1 and 10);
exception when duplicate_object then null; end $$;

-- 4) Tabla asistencias: I..IV -> 1..10 ---------------------------
alter table public.asistencias add column if not exists ciclo_num smallint;

update public.asistencias
   set ciclo_num = case ciclo::text
                      when 'I' then 1 when 'II' then 2
                      when 'III' then 3 when 'IV' then 4
                    end
 where ciclo_num is null and ciclo is not null;

alter table public.asistencias drop column if exists ciclo;
alter table public.asistencias rename column ciclo_num to ciclo;

update public.asistencias set ciclo = 1 where ciclo is null;

alter table public.asistencias
  alter column ciclo set not null,
  alter column ciclo set default 1;

alter table public.asistencias
  add column if not exists programa public.programa;

update public.asistencias set programa = 'SENATI' where programa is null;
alter table public.asistencias alter column programa set not null;
alter table public.asistencias alter column programa set default 'SENATI';

do $$ begin
  alter table public.asistencias
    add constraint asistencias_ciclo_rango
    check (ciclo between 1 and 10);
exception when duplicate_object then null; end $$;

-- 5) Indice para reportes -----------------------------------------
create index if not exists asistencias_programa_ciclo_idx
  on public.asistencias (programa, ciclo, fecha desc);

-- 6) Vista de control para el docente / coordinator ----------------
create or replace view public.vista_asistencias as
select
  a.id,
  a.correo,
  a.nombres,
  a.apellidos,
  a.programa,
  a.ciclo,
  a.turno,
  a.asistio,
  a.fecha,
  p.id as practicante_id
from public.asistencias a
join public.practicantes p on p.id = a.practicante_id;

revoke all on public.vista_asistencias from anon, authenticated;
grant select on public.vista_asistencias to service_role;

-- 7) El enum viejo de ciclos ya no se usa -------------------------
drop type if exists public.ciclo;