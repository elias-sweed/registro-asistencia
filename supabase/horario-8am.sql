-- =============================================================
--  HORARIO DE REGISTRO: 8:00 a 8:15
--  Dashboard de Supabase -> SQL Editor -> New query -> Run
--  Reemplaza la funcion registrar_asistencia con el nuevo horario.
-- =============================================================

drop function if exists public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint);

create or replace function public.registrar_asistencia(
  p_nombres   text,
  p_apellidos text,
  p_programa  public.programa,
  p_ciclo     smallint,
  p_fecha     timestamptz default now(),
  p_ip        text default null,
  p_hora      smallint default null,
  p_minuto    smallint default null
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

  -- Ventana unica: de 8:00 a 8:15 (hora del dispositivo).
  if coalesce(p_hora, -1) <> 8 or coalesce(p_minuto, -1) >= 15 then
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

revoke execute on function public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint, smallint) from public, anon;
grant execute on function public.registrar_asistencia(text, text, public.programa, smallint, timestamptz, text, smallint, smallint) to authenticated;