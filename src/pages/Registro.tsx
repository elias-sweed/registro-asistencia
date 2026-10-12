import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { BienvenidaModal } from '../components/BienvenidaModal'
import { CelebracionRegistro } from '../components/CelebracionRegistro'
import { Escudo, Ornamento } from '../components/Escudo'
import { FondoRayos } from '../components/FondoRayos'
import { ModalBloqueo } from '../components/ModalBloqueo'
import SlideCommit from '../components/SlideCommit'
import { Toast } from '../components/Toast'
import type { ToastTipo } from '../components/Toast'
import { useAuth } from '../context/authContext'
import {
  PROGRAMAS,
  TURNOS,
  aplicaCiclo,
  ciclosDe,
  formatearFecha,
  textoPrograma,
} from '../lib/constantes'
import { borrarCuentaPendiente } from '../lib/cuentaPendiente'
import { obtenerIpPublica } from '../lib/ip'
import { supabase } from '../lib/supabase'
import { limpiarNombre, validarNombre } from '../lib/validacion'
import type { Programa, Turno } from '../lib/types'

type Errores = Partial<
  Record<'nombres' | 'apellidos' | 'programa' | 'ciclo' | 'turno' | 'asistio', string>
>

type Bloqueo = {
  titulo: string
  descripcion: string
  detalle?: ReactNode
  pie?: string
}

const HORA_INICIO_TARDE = 12

export function Registro() {
  const { sesion, cargando } = useAuth()

  if (cargando) return <PantallaCarga />
  if (!sesion) return <Navigate to="/login" replace />

  return <Formulario uid={sesion.user.id} />
}

function PantallaCarga() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
    </div>
  )
}

function Formulario({ uid }: { uid: string }) {
  const { correo, recienConfirmada, salir } = useAuth()

  const [bienvenida, setBienvenida] = useState(true)
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [programa, setPrograma] = useState<Programa | ''>('')
  const [ciclo, setCiclo] = useState<number | ''>('')
  const [turno, setTurno] = useState<Turno | ''>('')
  const [asistio, setAsistio] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState<{ mensaje: string; tipo: ToastTipo } | null>(() =>
    recienConfirmada
      ? {
          mensaje: `¡Cuenta creada con éxito! Bienvenido ${correo}. Ya puedes registrar tu asistencia.`,
          tipo: 'exito',
        }
      : null,
  )
const [ahora, setAhora] = useState(() => new Date())
  const [yaRegistro, setYaRegistro] = useState(false)
  const [celebracion, setCelebracion] = useState<{ nombre: string; programa: string } | null>(null)
  const [bloqueo, setBloqueo] = useState<Bloqueo | null>(null)

  const cerrarBloqueo = useCallback(() => setBloqueo(null), [])

  // Al cerrar el modal de "asistencia registrada" se cierra la sesion
  // y el practicante vuelve al inicio (pantalla de acceso).
  const cerrarCelebracionYSalir = useCallback(() => {
    setCelebracion(null)
    void salir()
  }, [salir])

  const cajaSlider = useRef<HTMLDivElement>(null)
  const [anchoSlider, setAnchoSlider] = useState(320)

  useEffect(() => {
    const caja = cajaSlider.current
    if (!caja) return

    const medir = () => setAnchoSlider(Math.max(240, Math.floor(caja.clientWidth)))

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(caja)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (recienConfirmada) borrarCuentaPendiente()
  }, [recienConfirmada])

  const cerrarBienvenida = useCallback(() => setBienvenida(false), [])
  const cerrarAviso = useCallback(() => setAviso(null), [])
  const detalleErrorSlider = useCallback((fallo: unknown) => {
    const mensaje = fallo instanceof Error ? fallo.message : ''
    if (mensaje === 'Faltan campos obligatorios') return
    if (mensaje === 'IP_YA_REGISTRADA') return
    if (fallo instanceof Error && fallo.message.includes('FUERA_DE_HORARIO')) return
    setAviso({ mensaje: 'No se pudo guardar la asistencia. Inténtalo otra vez.', tipo: 'error' })
  }, [])

  const consultarHistorial = useCallback(async () => {
    const { data } = await supabase
      .from('asistencias')
      .select('id')
      .limit(1)
    return data ?? []
  }, [])

  useEffect(() => {
    let activo = true
    ;(async () => {
      const registros = await consultarHistorial()
      if (activo && registros.length > 0) setYaRegistro(true)
    })()
    return () => {
      activo = false
    }
  }, [consultarHistorial])

  useEffect(() => {
    let activo = true
    ;(async () => {
      const { data } = await supabase
        .from('practicantes')
        .select('*')
        .eq('id', uid)
        .maybeSingle()
      if (!activo || !data) return
      setNombres(data.nombres ?? '')
      setApellidos(data.apellidos ?? '')
      setPrograma(data.programa ?? '')
      setCiclo(data.ciclo ?? '')
      setTurno(data.turno ?? '')
    })()
    return () => {
      activo = false
    }
  }, [uid])

  function evitarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
  }

  function validar(): Errores {
    const nuevos: Errores = {}

    const errorNombres = validarNombre(nombres)
    if (errorNombres) nuevos.nombres = errorNombres

    const errorApellidos = validarNombre(apellidos)
    if (errorApellidos) nuevos.apellidos = errorApellidos

    if (!programa) nuevos.programa = 'Selecciona tu programa.'
    if (programa && aplicaCiclo(programa) && ciclo === '')
      nuevos.ciclo = 'Selecciona tu ciclo.'
    if (!turno) nuevos.turno = 'Selecciona tu turno.'
    if (!asistio) nuevos.asistio = 'Debes marcar la asistencia para registrar.'

    return nuevos
  }

  async function registrar(): Promise<void> {
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      setAviso({ mensaje: 'Completa todos los campos obligatorios.', tipo: 'error' })
      throw new Error('Faltan campos obligatorios')
    }

    const fechaISO = new Date().toISOString()
    const nombreLimpio = nombres.trim()
    const apellidoLimpio = apellidos.trim()
    const cicloFinal = aplicaCiclo(programa) ? Number(ciclo) : null

    // Hora del dispositivo: el turno tarde solo marca desde las 12:00.
    const ahora = new Date()
    const horaDispositivo = ahora.getHours()

    if (turno === 'TARDE' && horaDispositivo < HORA_INICIO_TARDE) {
      setBloqueo({
        titulo: 'Todavía no es tu turno',
        descripcion:
          'Seleccionaste el turno TARDE, pero su horario empieza a las 12:00 del mediodía. Vuelve a entrar a esta hora para marcar.',
        detalle: (
          <>
            <span className="block text-xs tracking-[0.18em] text-perla-400 uppercase">
              Hora de tu dispositivo
            </span>
            <span className="mt-1 block font-mono text-2xl text-oro-400">
              {formatearFecha(ahora)}
            </span>
            <span className="mt-2 block text-xs text-perla-300">
              El turno TARDE se registra a partir de las 12:00.
            </span>
          </>
        ),
        pie: 'Si tu reloj está desfasado, corrígelo antes de volver a intentar.',
      })
      throw new Error('FUERA_DE_HORARIO')
    }

    const ip = await obtenerIpPublica()

    const { error } = await supabase.rpc('registrar_asistencia', {
      p_nombres: nombreLimpio,
      p_apellidos: apellidoLimpio,
      p_programa: programa as Programa,
      p_ciclo: cicloFinal,
      p_turno: turno as Turno,
      p_fecha: fechaISO,
      p_ip: ip,
      p_hora: horaDispositivo,
    })

    if (error) {
      if (/IP_YA_REGISTRADA/.test(error.message)) {
        setBloqueo({
          titulo: 'Solo se puede registrar una vez',
          descripcion:
            'Desde este dispositivo ya se registró una asistencia. No es posible volver a marcar, aunque se cree una cuenta con otro correo o se abra desde otro navegador.',
          detalle: (
            <span className="font-mono text-xs">
              IP del dispositivo: <span className="text-oro-400">{ip ?? 'no detectada'}</span>
            </span>
          ),
          pie: 'Si crees que es un error, comunícate con el coordinador de la institución.',
        })
        throw new Error('IP_YA_REGISTRADA')
      }
      if (/FUERA_DE_HORARIO/.test(error.message)) {
        setBloqueo({
          titulo: 'Todavía no es tu turno',
          descripcion:
            'El turno TARDE se registra a partir de las 12:00 del mediodía. Vuelve a entrar a esa hora.',
        })
        throw error
      }
      if (/CAMPOS_OBLIGATORIOS/.test(error.message)) {
        setAviso({ mensaje: 'Completa todos los campos obligatorios.', tipo: 'error' })
        throw error
      }
      if (/NO_AUTENTICADO/.test(error.message)) {
        setAviso({ mensaje: 'Tu sesión expiró. Vuelve a ingresar.', tipo: 'error' })
        throw error
      }
      setAviso({ mensaje: `No se pudo registrar: ${error.message}`, tipo: 'error' })
      throw error
    }

    setAsistio(false)
    setYaRegistro(true)
    setAviso({ mensaje: `Asistencia registrada ${nombreLimpio}`, tipo: 'exito' })
    setCelebracion({
      nombre: `${nombreLimpio} ${apellidoLimpio}`,
      programa: `${textoPrograma(programa as Programa)}${cicloFinal ? ` · Ciclo ${cicloFinal}` : ''}`,
    })
  }

  return (
    <div className="relative min-h-screen px-4 py-8">
      <FondoRayos />
      <div className="textura pointer-events-none fixed inset-0" aria-hidden="true" />

      <BienvenidaModal
        visible={bienvenida}
        detalle={`${correo} · preparando tu registro`}
        onCerrar={cerrarBienvenida}
      />

      {bloqueo && (
        <ModalBloqueo visible {...bloqueo} onCerrar={cerrarBloqueo} />
      )}

      {yaRegistro && !celebracion && !bloqueo && (
        <ModalBloqueo
          visible
          titulo="Ya tienes tu asistencia registrada"
          descripcion="Solo se puede registrar una vez. Tu registro ya está guardado, por lo que el formulario ya no está disponible."
          pie="Si crees que se trata de un error, comunícate con el coordinador de la institución."
          onCerrar={() => void salir()}
        />
      )}

      {celebracion && (
        <CelebracionRegistro
          visible
          nombre={celebracion.nombre}
          programa={celebracion.programa}
          onCerrar={cerrarCelebracionYSalir}
        />
      )}

      {aviso && (
        <Toast mensaje={aviso.mensaje} tipo={aviso.tipo} onCerrar={cerrarAviso} />
      )}

      <div className="relative mx-auto w-full max-w-lg">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <Escudo alto="h-14" />
            <div>
              <p className="rotulo">I.E. Superior N.º P · Tarapoto</p>
              <h1 className="font-display text-2xl leading-tight font-semibold text-perla-50">
                Registro de Asistencia
              </h1>
              <p className="truncate text-sm text-perla-300">{correo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void salir()}
            className="shrink-0 rounded border border-ink-600 bg-ink-900/70 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-perla-200 uppercase transition hover:border-oro-500/60 hover:text-oro-400"
          >
            Salir
          </button>
        </header>

        <form
          onSubmit={evitarEnvio}
          noValidate
          className="panel rounded-xl p-7"
        >
          <h2 className="font-display text-xl font-semibold text-perla-50">
            Datos del practicante
          </h2>
          <div className="mt-3">
            <Ornamento />
          </div>

          <div className="mt-6 space-y-5">
            <Campo id="nombres" etiqueta="Nombres" error={errores.nombres}>
              <input
                id="nombres"
                name="nombres"
                type="text"
                required
                minLength={2}
                maxLength={60}
                autoComplete="given-name"
                value={nombres}
                onChange={(e) => setNombres(limpiarNombre(e.target.value))}
                onBlur={() => {
                  const error = validarNombre(nombres)
                  setErrores((previos) => ({ ...previos, nombres: error ?? undefined }))
                }}
                placeholder="Juan Carlos"
                className={claseCampo(Boolean(errores.nombres))}
              />
            </Campo>

            <Campo id="apellidos" etiqueta="Apellidos" error={errores.apellidos}>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                required
                minLength={2}
                maxLength={60}
                autoComplete="family-name"
                value={apellidos}
                onChange={(e) => setApellidos(limpiarNombre(e.target.value))}
                onBlur={() => {
                  const error = validarNombre(apellidos)
                  setErrores((previos) => ({ ...previos, apellidos: error ?? undefined }))
                }}
                placeholder="Quispe Huamán"
                className={claseCampo(Boolean(errores.apellidos))}
              />
            </Campo>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="programa" etiqueta="Programa / Rol" error={errores.programa}>
                <select
                  id="programa"
                  name="programa"
                  required
                  value={programa}
                  onChange={(e) => {
                    setPrograma(e.target.value as Programa | '')
                    setCiclo('')
                  }}
                  className={claseCampo(Boolean(errores.programa))}
                >
                  <option value="">Selecciona…</option>
                  {PROGRAMAS.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.texto}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo id="ciclo" etiqueta="Ciclo" error={errores.ciclo}>
                <select
                  id="ciclo"
                  name="ciclo"
                  required={aplicaCiclo(programa)}
                  disabled={!aplicaCiclo(programa)}
                  value={ciclo}
                  onChange={(e) =>
                    setCiclo(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={`${claseCampo(Boolean(errores.ciclo))} disabled:cursor-not-allowed disabled:border-ink-700 disabled:bg-ink-950 disabled:text-perla-400`}
                >
                  <option value="">
                    {programa ? (aplicaCiclo(programa) ? 'Selecciona…' : 'No aplica') : 'Selecciona…'}
                  </option>
                  {ciclosDe(programa).map((numero) => (
                    <option key={numero} value={numero}>
                      {numero}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo id="turno" etiqueta="Turno" error={errores.turno}>
              <select
                id="turno"
                name="turno"
                required
                value={turno}
                onChange={(e) => setTurno(e.target.value as Turno | '')}
                className={claseCampo(Boolean(errores.turno))}
              >
                <option value="">Selecciona…</option>
                {TURNOS.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="fecha" etiqueta="Fecha y hora del registro">
              <div className="relative">
                <input
                  id="fecha"
                  name="fecha"
                  type="text"
                  readOnly
                  disabled
                  value={formatearFecha(ahora)}
                  className="campo pr-11"
                />
                <svg
                  className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-oro-500/70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5V12l3 1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-1.5 text-xs text-perla-400">
                Se registra automáticamente al enviar.
              </p>
            </Campo>

            <div>
              <label
                htmlFor="asistio"
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5 transition ${
                  errores.asistio
                    ? 'border-carmesi-400 bg-carmesi-500/10'
                    : asistio
                      ? 'border-oro-500/70 bg-oro-500/10'
                      : 'border-ink-600 bg-ink-950/40 hover:border-oro-500/50'
                }`}
              >
                <input
                  id="asistio"
                  name="asistio"
                  type="checkbox"
                  required
                  checked={asistio}
                  onChange={(e) => setAsistio(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-oro-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-perla-50">
                    Asistió y marcó <span className="text-oro-400">*</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-perla-300">
                    Marca esta casilla para confirmar tu asistencia al turno.
                  </span>
                </span>
              </label>
              {errores.asistio && (
                <p className="mt-1.5 text-xs text-carmesi-400">{errores.asistio}</p>
              )}
            </div>

            <div ref={cajaSlider} className="flex justify-center pt-1">
              <SlideCommit
                label="Desliza para registrar"
                doneLabel="¡Registrado!"
                errorLabel="No se pudo registrar"
                onConfirm={registrar}
                onError={detalleErrorSlider}
                trackColor="#0b0b12"
                handleColor="#ece3d2"
                successColor="#c9a227"
                dangerColor="#b32026"
                width={anchoSlider}
                height={58}
                radius={29}
                holdMs={1800}
                className="max-w-full"
              />
            </div>

            <p className="text-center text-xs text-perla-400">
              Arrastra el tirador hasta el extremo o usa las flechas del teclado y{' '}
              <span className="text-perla-300">Fin</span>.
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-perla-400">
          Todos los campos son obligatorios
        </p>
      </div>
    </div>
  )
}

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string
  etiqueta: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo mb-1.5 block">
        {etiqueta} <span className="text-oro-500">*</span>
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-carmesi-400">{error}</p>}
    </div>
  )
}

function claseCampo(error: boolean) {
  return `campo ${error ? 'campo-error' : ''}`
}