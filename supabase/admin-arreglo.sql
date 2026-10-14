-- =============================================================
--  ACCESO AL PANEL: ARREGLO Y COMPROBACION
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  Se puede ejecutar varias veces sin romper nada.
-- =============================================================

-- 1) Comparar el correo sin distinguir mayusculas ----------------
--    Antes solo coincidia si el correo estaba escrito EXACTAMENTE
--    igual en Supabase Auth y en la tabla administradores.
--    Con lower() en los dos lados da igual si hay mayusculas.
drop policy if exists "administradores_lectura_propia" on public.administradores;
create policy "administradores_lectura_propia" on public.administradores
  for select using (lower(correo) = lower(coalesce(auth.jwt() ->> 'email', '')));

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administradores
     where lower(correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
       and activo
  );
$$;

revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- 1b) Correos con acceso al panel --------------------------------
--     El panel los usa para no contarse a si mismo entre los
--     practicantes. Si quien pregunta no es administrador, devuelve
--     una lista vacia: asi un practicante no puede enterarse de
--     quienes administran.
create or replace function public.correos_administradores()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
           when exists (
             select 1 from public.administradores
              where lower(correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
                and activo
           )
           then coalesce(array_agg(lower(correo)), '{}'::text[])
           else '{}'::text[]
         end
  from public.administradores
 where activo;
$$;

revoke execute on function public.correos_administradores() from public, anon;
grant execute on function public.correos_administradores() to authenticated;

-- 2) Alta rapida de un administrador ------------------------------
--    Edita el correo, quita el -- y ejecuta solo este bloque.
-- insert into public.administradores (correo, nombre) values
--   ('tucorreo@gmail.com', 'Coordinador')
-- on conflict (correo) do update
--   set activo = true, nombre = excluded.nombre;

-- 3) COMPROBACION: revisa el resultado de esta consulta -----------
--    Tu correo de administrador tiene que aparecer en la lista.
select correo, nombre, activo from public.administradores order by correo;

-- 4) Si la lista sale vacia, tu cuenta no es administradora ------
--    Usa el bloque del punto 2 y despues vuelve a entrar.