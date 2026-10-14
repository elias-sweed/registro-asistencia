-- =============================================================
--  QUE LA CUENTA DEL ADMINISTRADOR NO APAREZCA COMO PRACTICANTE
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  Se puede ejecutar varias veces sin romper nada.
-- =============================================================

-- -------------------------------------------------------------
--  POR QUE PASÓ
--  La función handle_new_user() inserta una fila en
--  public.practicantes por CADA cuenta que se crea en Supabase
--  Authentication. No miraba quién es el administrador, por eso tu
--  cuenta quedó listada como practicante (con programa SENATI por
--  defecto y sin nombre).
-- -------------------------------------------------------------

-- 1) Revisar antes de cambiar nada ----------------------------
--    Si aquí no sale nada, no hay administradores con registros.
select p.correo,
       count(a.id) as asistencias
  from public.practicantes p
  left join public.asistencias a on a.practicante_id = p.id
 where lower(p.correo) in (select lower(correo) from public.administradores)
 group by p.correo;

-- 2) Que el trigger ya no cree filas para los administradores --
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si este correo administra el panel, no es un practicante.
  if exists (
    select 1 from public.administradores where lower(correo) = lower(new.email)
  ) then
    return new;
  end if;

  insert into public.practicantes (id, correo)
  values (new.id, new.email)
  on conflict (id) do update set correo = excluded.correo;
  return new;
end;
$$;

-- 3) Quitar la fila que ya quedó mal ---------------------------
--    Solo se borra si esa persona NO tiene asistencia registrada,
--    para no perder datos de verdad.
delete from public.practicantes p
 where lower(p.correo) in (select lower(correo) from public.administradores)
   and not exists (select 1 from public.asistencias a where a.practicante_id = p.id);

-- 4) Limpiar las cuentas de prueba que se crearon al revisar el
--    sistema (diagnóstico). No son personas reales.
delete from auth.users
 where email like 'diag.%@test.com'
    or email like 'trigger.%@test.com';

-- 5) COMPROBACION ----------------------------------------------
--    El administrador debe salir en la primera consulta y en la
--    segunda no debe salir ninguna fila.
select correo, nombre, activo
  from public.administradores
 order by correo;

select p.correo, p.nombres, p.programa
  from public.practicantes p
 where lower(p.correo) in (select lower(correo) from public.administradores);