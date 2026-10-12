import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { CampoClave } from '../components/CampoClave'
import { Escudo, Ornamento } from '../components/Escudo'
import { FondoRayos } from '../components/FondoRayos'
import { useAuth } from '../context/authContext'
import { borrarCuentaPendiente, guardarCuentaPendiente } from '../lib/cuentaPendiente'
import { supabase } from '../lib/supabase'
import { validarClave, validarCorreo } from '../lib/validacion'

type Modo = 'ingresar' | 'registrar'

export function Login() {
  const { sesion, cargando } = useAuth()
  const [modo, setModo] = useState<Modo>('ingresar')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState<string | null>(null)

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
      </div>
    )
  }

  if (sesion) return <Navigate to="/registro" replace />

  const esRegistro = modo === 'registrar'

  async function entrar(correoLimpio: string, contrasena: string) {
    const { error: errorIngreso } = await supabase.auth.signInWithPassword({
      email: correoLimpio,
      password: contrasena,
    })
    return errorIngreso
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError('')

    const errorCorreo = validarCorreo(correo)
    if (errorCorreo) {
      setError(errorCorreo)
      return
    }

    const errorClave = validarClave(clave)
    if (errorClave) {
      setError(errorClave)
      return
    }

    setEnviando(true)
    const correoLimpio = correo.trim().toLowerCase()

    try {
      if (esRegistro) {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email: correoLimpio,
          password: clave,
        })
        if (errorRegistro) throw errorRegistro

        guardarCuentaPendiente(correoLimpio, clave)

        if (data.session) {
          borrarCuentaPendiente()
          return
        }

        const errorIngreso = await entrar(correoLimpio, clave)
        if (errorIngreso) {
          setEnviando(false)
          setEsperandoConfirmacion(correoLimpio)
          return
        }
      } else {
        const errorIngreso = await entrar(correoLimpio, clave)
        if (errorIngreso) throw errorIngreso
        borrarCuentaPendiente()
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo))
      setEnviando(false)
    }
  }

  async function reintentarIngreso() {
    if (!esperandoConfirmacion) return
    setEnviando(true)
    setError('')

    const errorIngreso = await entrar(esperandoConfirmacion, clave)

    if (errorIngreso) {
      setError(
        /Email not confirmed/i.test(errorIngreso.message)
          ? 'Todavía no confirmaste el correo. Abre el enlace que te enviamos por Gmail.'
          : mensajeDeError(errorIngreso),
      )
      setEnviando(false)
      return
    }

    borrarCuentaPendiente()
  }

  async function reenviarCorreo() {
    if (!esperandoConfirmacion) return
    setEnviando(true)
    setError('')

    const { error: errorReenvio } = await supabase.auth.resend({
      type: 'signup',
      email: esperandoConfirmacion,
    })

    setEnviando(false)
    setError(
      errorReenvio
        ? 'No pudimos reenviar el correo. Inténtalo más tarde.'
        : 'Te enviamos un correo nuevo. Revisa la bandeja de entrada y la de spam.',
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <FondoRayos />
      <div className="textura pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <header className="mb-7 flex flex-col items-center text-center">
          <Escudo alto="h-24" />
          <p className="rotulo mt-4">Institución Educativa Superior N.º P</p>
          <h1 className="font-display mt-1 text-3xl leading-tight font-semibold text-perla-50">
            Registro de Asistencia
          </h1>
          <p className="mt-1 text-sm italic text-perla-300">
            Superación · Estudio · Trabajo — Tarapoto
          </p>
          <div className="mt-4 w-40">
            <Ornamento />
          </div>
        </header>

        <main className="panel rounded-xl p-7">
          {esperandoConfirmacion ? (
            <section aria-live="polite">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-oro-500/40 bg-oro-500/10">
                <svg className="h-6 w-6 text-oro-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 7.5l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" />
                </svg>
              </span>

              <h2 className="font-display text-center text-2xl font-semibold text-oro-300">
                ¡Cuenta creada!
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-perla-200">
                Enviamos un correo de confirmación a{' '}
                <span className="font-semibold text-perla-50">{esperandoConfirmacion}</span>. Ábrelo
                en Gmail, haz clic en el enlace y volverás aquí automáticamente con tu formulario
                listo.
              </p>

              <div className="mt-4 rounded-lg border border-ink-600 bg-ink-950/60 p-3 text-xs text-perla-300">
                <p className="rotulo mb-1">Tus datos ya están rellenados</p>
                <p>
                  Correo: <span className="text-perla-100">{esperandoConfirmacion}</span>
                </p>
              </div>

              {error && (
                <p role="alert" className="mt-3 rounded-lg border border-carmesi-400/40 bg-carmesi-500/10 px-3 py-2 text-sm text-perla-100">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void reintentarIngreso()}
                disabled={enviando}
                className="boton-oro mt-5"
              >
                {enviando ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                ) : (
                  'Ya confirmé mi correo'
                )}
              </button>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button type="button" onClick={() => void reenviarCorreo()} className="enlace">
                  Reenviar correo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEsperandoConfirmacion(null)
                    setModo('ingresar')
                    setError('')
                  }}
                  className="enlace text-perla-300 hover:text-perla-100"
                >
                  Volver al acceso
                </button>
              </div>
            </section>
          ) : (
            <>
              <h2 className="font-display text-center text-xl font-semibold text-perla-50">
                {esRegistro ? 'Crear cuenta de practicante' : 'Ingresar con tu correo'}
              </h2>
              <p className="mt-1 text-center text-sm text-perla-300">
                {esRegistro
                  ? 'Solo necesitas tu correo y una contraseña.'
                  : 'El acceso es exclusivo para practicantes registrados.'}
              </p>

              <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-4">
                <div>
                  <label htmlFor="correo" className="rotulo mb-1.5 block">
                    Correo electrónico *
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="practicante@ie.edu.pe"
                    className="campo"
                  />
                </div>

                <div>
                  <label htmlFor="clave" className="rotulo mb-1.5 block">
                    Contraseña *
                  </label>
                  <CampoClave
                    id="clave"
                    valor={clave}
                    alCambiar={setClave}
                    autoComplete={esRegistro ? 'new-password' : 'current-password'}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-carmesi-400/40 bg-carmesi-500/10 px-3 py-2 text-sm text-perla-100"
                  >
                    {error}
                  </p>
                )}

                <button type="submit" disabled={enviando} className="boton-oro">
                  {enviando ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                  ) : esRegistro ? (
                    'Crear cuenta'
                  ) : (
                    'Ingresar'
                  )}
                </button>

                <p className="pt-1 text-center text-sm text-perla-300">
                  {esRegistro ? '¿Ya tienes cuenta?' : '¿Primera vez aquí?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModo(esRegistro ? 'ingresar' : 'registrar')
                      setError('')
                    }}
                    className="enlace"
                  >
                    {esRegistro ? 'Ingresar' : 'Crear cuenta'}
                  </button>
                </p>
              </form>
            </>
          )}
        </main>

        <p className="mt-5 text-center text-xs leading-relaxed text-perla-400">
          Todos los campos son obligatorios · La fecha y hora se registran automáticamente
        </p>
      </div>
    </div>
  )
}

function mensajeDeError(fallo: unknown) {
  const mensaje =
    fallo instanceof Error ? fallo.message : 'Ocurrió un error, inténtalo otra vez.'

  if (/Invalid login credentials/i.test(mensaje)) return 'Correo o contraseña incorrectos.'
  if (/User already registered/i.test(mensaje))
    return 'Ese correo ya está registrado. Ingresa con tu contraseña.'
  if (/Email not confirmed/i.test(mensaje))
    return 'Confirma tu correo desde el enlace que te enviamos.'
  if (/Password should be at least/i.test(mensaje))
    return 'La contraseña debe tener al menos 6 caracteres.'
  if (/rate limit|too many|security purposes/i.test(mensaje))
    return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  return mensaje
}