-- =============================================================
--  PANEL DE ADMINISTRADOR
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--
--  1) Crea el usuario en Authentication -> Users (con email
--     confirmado) y luego agregalo aqui abajo como ADMINISTRADOR.
--  2) Solo ese correo podra ver el panel /login/admin
-- =============================================================

-- 1) Administradores -------------------------------------------
create table if not exists public.administradores (
  correo     text primary key,
  nombre     text,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

comment on table public.administradores is 'Correos con acceso al panel de control';

alter table public.administradores enable row level security;

drop policy if exists "administradores_lectura_propia" on public.administradores;
create policy "administradores_lectura_propia" on public.administradores
  for select using (correo = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke insert, update, delete on public.administradores from anon, authenticated;

-- 2) Agrega aqui los correos que tendran acceso ---------------
--    Ejemplo (quita las comillas y pon tus correos):
-- insert into public.administradores (correo, nombre) values
--   ('tucorreo@ie.edu.pe', 'Coordinador')
-- on conflict (correo) do update set activo = true, nombre = excluded.nombre;

-- 3) Funcion: el usuario actual es administrador? ------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administradores
     where correo = lower(coalesce(auth.jwt() ->> 'email', ''))
       and activo
  );
$$;

revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- 4) Funcion: todos los datos del panel ------------------------
create or replace function public.admin_datos()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if not exists (
    select 1 from public.administradores where correo = v_email and activo
  ) then
    raise exception 'NO_ADMIN';
  end if;

  return jsonb_build_object(

    'resumen', (
      select jsonb_build_object(
        'cuentas',    (select count(*) from public.practicantes),
        'marcaron',   (select count(*) from public.asistencias),
        'pendientes', (select count(*) from public.practicantes)
                     - (select count(*) from public.asistencias),
        'hoy',        (select count(*) from public.asistencias
                        where (fecha at time zone 'America/Lima')::date = current_date),
        'sin_programa', (select count(*) from public.practicantes where programa is null)
      )
    ),

    -- Cuantas cuentas tiene cada programa y cuantas marcaron
    'por_programa', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.programa), '[]'::jsonb)
      from (
        select coalesce(p.programa::text, 'SIN_DATO') as programa,
               count(*)::int                        as total,
               count(a.id)::int                      as marcaron
        from public.practicantes p
        left join public.asistencias a on a.practicante_id = p.id
        group by coalesce(p.programa::text, 'SIN_DATO')
      ) t
    ),

    -- Distribucion por ciclo
    'por_ciclo', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.ciclo), '[]'::jsonb)
      from (
        select coalesce(p.ciclo::int, 0) as ciclo,
               count(*)::int            as total,
               count(a.id)::int         as marcaron
        from public.practicantes p
        left join public.asistencias a on a.practicante_id = p.id
        group by coalesce(p.ciclo::int, 0)
      ) t
    ),

    -- Registros por dia (ultimos 7)
    'por_dia', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.dia), '[]'::jsonb)
      from (
        select (a.fecha at time zone 'America/Lima')::date::text as dia,
               count(*)::int as total
        from public.asistencias a
        where a.fecha >= (current_date - 6)
        group by (a.fecha at time zone 'America/Lima')::date
      ) t
    ),

    -- Cuentas con su asistencia
    'marcaron', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.fecha desc), '[]'::jsonb)
      from (
        select p.correo,
               coalesce(p.nombres, '')  as nombres,
               coalesce(p.apellidos, '') as apellidos,
               coalesce(p.programa::text, 'SIN_DATO') as programa,
               p.ciclo,
               a.turno::text as turno,
               a.fecha
        from public.asistencias a
        join public.practicantes p on p.id = a.practicante_id
      ) t
    ),

    -- Cuentas que aun no marcan
    'pendientes', (
      select coalesce(jsonb_agg(row_to_json(t) order by t.creado_en desc), '[]'::jsonb)
      from (
        select p.correo,
               coalesce(p.nombres, '')   as nombres,
               coalesce(p.apellidos, '') as apellidos,
               coalesce(p.programa::text, 'SIN_DATO') as programa,
               p.ciclo,
               p.creado_en
        from public.practicantes p
        where not exists (
          select 1 from public.asistencias a where a.practicante_id = p.id
        )
      ) t
    )
  );
end;
$$;

revoke execute on function public.admin_datos() from public, anon;
grant execute on function public.admin_datos() to authenticated;

-- 5) Vista de control (solo service_role) ---------------------
drop view if exists public.vista_registros_ip;
create or replace view public.vista_registros_ip as
select r.ip, r.correo, r.creado_en,
       coalesce(p.nombres, '') || ' ' || coalesce(p.apellidos, '') as practicante
from public.registros_ip r
left join public.practicantes p on p.id = r.practicante_id
order by r.creado_en desc;

revoke all on public.vista_registros_ip from anon, authenticated;
grant select on public.vista_registros_ip to service_role;