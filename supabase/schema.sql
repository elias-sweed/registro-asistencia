-- =============================================================
--  CONTROL DE ASISTENCIA - PRACTICANTES  |  Esquema de Supabase
--  Ejecuta este script en: Dashboard de Supabase -> SQL Editor
-- =============================================================

-- 1) Tipos enumerados ------------------------------------------------
do $$ begin
  create type public.programa as enum ('SENATI', 'UCV', 'DOCENTE_API');
exception when duplicate_object then null; end $$;

-- Dos turnos: mañana y tarde
do $$ begin
  create type public.turno as enum ('MANANA', 'TARDE');
exception when duplicate_object then null; end $$;

-- 2) Tabla de practicantes ------------------------------------------
create table if not exists public.practicantes (
  id              uuid primary key references auth.users(id) on delete cascade,
  correo          text not null unique,
  nombres         text,
  apellidos        text,
  programa        public.programa default 'SENATI',
  ciclo           smallint check (ciclo is null or ciclo between 1 and 10),
  turno           public.turno,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

comment on table public.practicantes is 'Datos del practicante (se crea solo al registrarse)';

-- 3) Tabla de asistencias -------------------------------------------
create table if not exists public.asistencias (
  id              uuid primary key default gen_random_uuid(),
  practicante_id  uuid not null references public.practicantes(id) on delete cascade,
  correo          text not null,
  nombres         text not null check (char_length(trim(nombres)) >= 2),
  apellidos        text not null check (char_length(trim(apellidos)) >= 2),
  programa        public.programa not null default 'SENATI',
  ciclo           smallint check (ciclo is null or ciclo between 1 and 10),
  turno           public.turno not null default 'TARDE',
  asistio         boolean not null default true check (asistio = true),
  fecha           timestamptz not null default now(),
  creado_en       timestamptz not null default now()
);

comment on table public.asistencias is 'Registro de asistencia de los practicantes';

create index if not exists asistencias_practicante_idx
  on public.asistencias (practicante_id, fecha desc);

create index if not exists asistencias_programa_ciclo_idx
  on public.asistencias (programa, ciclo, fecha desc);

-- 4) Crear el practicante automaticamente al registrarse ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.practicantes (id, correo)
  values (new.id, new.email)
  on conflict (id) do update set correo = excluded.correo;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Row Level Security ----------------------------------------------
alter table public.practicantes enable row level security;
alter table public.asistencias enable row level security;

drop policy if exists "practicantes_select_own" on public.practicantes;
create policy "practicantes_select_own" on public.practicantes
  for select using (auth.uid() = id);

drop policy if exists "practicantes_insert_own" on public.practicantes;
create policy "practicantes_insert_own" on public.practicantes
  for insert with check (auth.uid() = id);

drop policy if exists "practicantes_update_own" on public.practicantes;
create policy "practicantes_update_own" on public.practicantes
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "asistencias_select_own" on public.asistencias;
create policy "asistencias_select_own" on public.asistencias
  for select using (auth.uid() = practicante_id);

drop policy if exists "asistencias_insert_own" on public.asistencias;
create policy "asistencias_insert_own" on public.asistencias
  for insert with check (auth.uid() = practicante_id);

-- 6) Vista de control para el docente / coordinator -------------------
--    Solo el service_role puede leerla (API del backend o dashboard).
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