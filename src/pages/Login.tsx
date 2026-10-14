import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { MarcoAcceso } from '../components/MarcoAcceso'
import { useAuth } from '../context/authContext'
import { esAdministrador } from '../lib/admin'
import { supabase } from '../lib/supabase'
import { generarClaveSegura, validarClave, validarCorreo } from '../lib/validacion'

type Modo = 'ingresar' | 'registrar'

export function Login() {
  const { sesion, cargando } = useAuth()
  const [modo, setModo] = useState<Modo>('ingresar')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [repetirClave, setRepetirClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [copiada, setCopiada] = useState(false)
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null)

  const correoSesion = sesion?.user.email ?? ''

  useEffect(() => {
    if (!sesion) return
    let vivo = true
    esAdministrador(correoSesion).then((ok) => {
      if (vivo) setEsAdmin(ok)
    })
    return () => {
      vivo = false
    }
  }, [sesion, correoSesion])

  if (cargando || (sesion && esAdmin === null)) {
    return (
      <div className="fondo-ie relative flex min-h-screen items-center justify-center">
        <div className="velo-ie" aria-hidden="true" />
        <span className="relative h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
      </div>
    )
  }

  if (sesion) return <Navigate to={esAdmin ? '/admin' : '/registro'} replace />

  const esRegistro = modo === 'registrar'

  function cambiarModo() {
    setModo(esRegistro ? 'ingresar' : 'registrar')
    setRepetirClave('')
    setError('')
    setCopiada(false)
  }

  function sugerirClave() {
    const nueva = generarClaveSegura()
    setClave(nueva)
    setRepetirClave(nueva)
    setCopiada(false)
    setError('')
  }

  async function copiarClave() {
    try {
      await navigator.clipboard.writeText(clave)
      setCopiada(true)
      window.setTimeout(() => setCopiada(false), 1500)
    } catch {
      setError('No se pudo copiar. Cópiala manualmente.')
    }
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

    if (esRegistro && clave !== repetirClave) {
      setError('Las contraseñas no coinciden.')
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

        const yaExistia =
          Boolean(errorRegistro) &&
          /already been registered|already registered|User already registered/i.test(
            errorRegistro?.message ?? '',
          )

        if (errorRegistro && !yaExistia) throw errorRegistro

        if (data?.session) return

        // El correo ya estaba dado de alta. Antes se entraba en silencio a esa
        // cuenta y el practicante creia que acababa de crear una nueva, para
        // encontrarse luego con un error al marcar. Ahora se avisa.
        const { error: errorIngreso } = await supabase.auth.signInWithPassword({
          email: correoLimpio,
          password: clave,
        })

        if (yaExistia && !errorIngreso) {
          setError(
            `Ese correo ya tenía una cuenta, así que entraste a esa (no se creó una nueva) y si ya habías marcado antes no podrás volver a marcar. Si necesitas una cuenta nueva, usa otro correo o avisa al coordinador.`,
          )
          setEnviando(false)
          return
        }

        if (errorIngreso) {
          if (/Invalid login credentials/i.test(errorIngreso.message)) {
            setError(
              'Ese correo ya tiene una cuenta con otra contraseña. Ingresa con tu contraseña, o avisa al coordinador si la olvidaste.',
            )
            return
          }
          throw errorIngreso
        }
      } else {
        const { error: errorIngreso } = await supabase.auth.signInWithPassword({
          email: correoLimpio,
          password: clave,
        })
        if (errorIngreso) throw errorIngreso
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo))
      setEnviando(false)
    }
  }

  return (
    <div className="fondo-ie relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="velo-ie" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <MarcoAcceso
          rotulo="I.E Jimenez Pimentel"
          titulo="Registro de Asistencia"
          subtitulo="Superación · Estudio · Trabajo — Tarapoto"
        />

        <main className="panel-vidrio rounded-2xl p-7 sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={modo}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h2 className="font-display text-center text-2xl font-semibold text-perla-50">
                {esRegistro ? 'Crear cuenta' : 'Ingresar'}
              </h2>
              <p className="mt-1 text-center text-sm text-perla-300/80">
                {esRegistro
                  ? 'Correo y contraseña. Tu cuenta queda lista al instante.'
                  : 'Escribe tu correo y contraseña para marcar tu asistencia.'}
              </p>

              <form onSubmit={manejarEnvio} noValidate className="mt-7 space-y-6">
                <div className="relative">
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder=" "
                    className="campo-flotante"
                  />
                  <label htmlFor="correo" className="etiqueta-flotante">
                    Correo electrónico *
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="clave"
                    name="clave"
                    type="password"
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete={esRegistro ? 'new-password' : 'current-password'}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder=" "
                    className="campo-flotante pr-10"
                  />
                  <label htmlFor="clave" className="etiqueta-flotante">
                    Contraseña *
                  </label>
                  <BotonVerClave id="clave" />
                  {esRegistro && (
                    <div className="mt-2.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={sugerirClave}
                        className="text-xs font-medium text-oro-400 underline decoration-oro-400/40 underline-offset-2 transition hover:text-oro-300"
                      >
                        Sugerir contraseña segura
                      </button>
                      {clave && (
                        <button
                          type="button"
                          onClick={copiarClave}
                          className="text-xs text-perla-300/70 transition hover:text-perla-100"
                        >
                          {copiada ? 'Copiada ✓' : 'Copiar'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {esRegistro && (
                  <div className="relative">
                    <input
                      id="repetirClave"
                      name="repetirClave"
                      type="password"
                      required
                      minLength={6}
                      maxLength={72}
                      autoComplete="new-password"
                      value={repetirClave}
                      onChange={(e) => setRepetirClave(e.target.value)}
                      placeholder=" "
                      className="campo-flotante pr-10"
                    />
                    <label htmlFor="repetirClave" className="etiqueta-flotante">
                      Confirmar contraseña *
                    </label>
                    <BotonVerClave id="repetirClave" />
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-carmesi-400/40 bg-carmesi-500/15 px-3 py-2 text-sm text-perla-100"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="boton-oro w-full rounded-xl py-3.5"
                >
                  {enviando ? (
                    <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                  ) : esRegistro ? (
                    'Crear cuenta'
                  ) : (
                    'Ingresar'
                  )}
                </button>

                <p className="text-center text-sm text-perla-300/80">
                  {esRegistro ? '¿Ya tienes cuenta?' : '¿Primera vez aquí?'}{' '}
                  <button
                    type="button"
                    onClick={cambiarModo}
                    className="font-medium text-oro-400 transition hover:text-oro-300"
                  >
                    {esRegistro ? 'Ingresar' : 'Crear cuenta'}
                  </button>
                </p>
              </form>
            </motion.div>
          </AnimatePresence>
        </main>

        <p className="mt-5 text-center text-sm text-perla-300/60">
          ¿No puedes entrar? Avisa al coordinador de la institución.
        </p>

        <p className="mt-2 text-center text-xs leading-relaxed text-perla-400/50">
          Todos los campos son obligatorios · La fecha y hora se registran automáticamente
        </p>
      </div>
    </div>
  )
}

function BotonVerClave({ id }: { id: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const input = document.getElementById(id) as HTMLInputElement
        input.type = input.type === 'password' ? 'text' : 'password'
      }}
      aria-label="Ver contraseña"
      title="Ver contraseña"
      className="absolute top-4 right-0 rounded p-1.5 text-perla-300/60 transition hover:text-oro-400 focus:text-oro-400 focus:outline-none"
    >
      <svg
        className="h-4.5 w-4.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" />
      </svg>
    </button>
  )
}

/** Los errores de Supabase no siempre son instancias de Error. */
function leerMensaje(fallo: unknown): string {
  if (!fallo) return 'Ocurrió un error, inténtalo otra vez.'
  if (typeof fallo === 'string') return fallo
  if (fallo instanceof Error) return fallo.message
  if (typeof fallo === 'object' && 'message' in fallo) {
    return String((fallo as { message?: unknown }).message ?? 'Ocurrió un error, inténtalo otra vez.')
  }
  return 'Ocurrió un error, inténtalo otra vez.'
}

function mensajeDeError(fallo: unknown) {
  const mensaje = leerMensaje(fallo)

  if (/Invalid login credentials/i.test(mensaje))
    return 'Nombre, apellidos o contraseña incorrectos.'
  if (/signups are disabled/i.test(mensaje))
    return 'En Supabase activa "Enable email signup" en Authentication → Providers → Email.'
  if (/User already registered|already been registered/i.test(mensaje))
    return 'Esa cuenta ya existe. Ingresa con tu contraseña.'
  if (/Password should be at least/i.test(mensaje))
    return 'La contraseña debe tener al menos 6 caracteres.'
  return mensaje
}