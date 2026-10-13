import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CampoClave } from '../components/CampoClave'
import { MarcoAcceso } from '../components/MarcoAcceso'
import { FondoRayos } from '../components/FondoRayos'
import { useAuth } from '../context/authContext'
import { esAdministrador } from '../lib/admin'
import { supabase } from '../lib/supabase'
import {
  correoDesdeNombre,
  generarClaveSegura,
  limpiarNombre,
  validarClave,
  validarNombre,
} from '../lib/validacion'

type Modo = 'ingresar' | 'registrar'

export function Login() {
  const { sesion, cargando } = useAuth()
  const [modo, setModo] = useState<Modo>('ingresar')
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
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

  const usuarioSugerido = useMemo(() => {
    const parte = `${nombre} ${apellidos}`
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return parte || '…'
  }, [nombre, apellidos])

  if (cargando || (sesion && esAdmin === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
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

    const errorNombre = validarNombre(nombre)
    if (errorNombre) {
      setError(errorNombre)
      return
    }

    const errorApellidos = validarNombre(apellidos)
    if (errorApellidos) {
      setError(errorApellidos)
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

    const nombreCompleto = `${nombre} ${apellidos}`.trim().toLowerCase().replace(/\s+/g, '')
    if (esRegistro && clave.toLowerCase().replace(/[^a-z]/g, '') === nombreCompleto.replace(/[^a-z]/g, '')) {
      setError('La contraseña no puede ser igual a tu nombre.')
      return
    }

    setEnviando(true)
    const correoInterno = correoDesdeNombre(nombre, apellidos)

    try {
      if (esRegistro) {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email: correoInterno,
          password: clave,
          options: {
            data: {
              nombres: nombre.trim(),
              apellidos: apellidos.trim(),
            },
          },
        })
        if (
          errorRegistro &&
          !/already been registered|already registered/i.test(errorRegistro.message)
        )
          throw errorRegistro

        if (data?.session) return

        const { error: errorIngreso } = await supabase.auth.signInWithPassword({
          email: correoInterno,
          password: clave,
        })

        if (errorIngreso) {
          if (/Invalid login credentials/i.test(errorIngreso.message)) {
            setError(
              'Ya existe una cuenta con este nombre. Si eres tú, ingresa con tu contraseña. Si hay otra persona con tu nombre, avisa al coordinador.',
            )
            return
          }
          throw errorIngreso
        }
      } else {
        const { error: errorIngreso } = await supabase.auth.signInWithPassword({
          email: correoInterno,
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <FondoRayos />
      <div className="textura pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <MarcoAcceso
          rotulo="Institución Educativa Superior N.º P"
          titulo="Registro de Asistencia"
          subtitulo="Superación · Estudio · Trabajo — Tarapoto"
        />

        <main className="panel rounded-xl p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={modo}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h2 className="font-display text-center text-xl font-semibold text-perla-50">
                {esRegistro ? 'Crear cuenta de practicante' : 'Ingresar'}
              </h2>
              <p className="mt-1 text-center text-sm text-perla-300">
                {esRegistro
                  ? 'Nombres, apellidos y contraseña. Tu cuenta queda lista al instante.'
                  : 'Escribe tu nombre, apellidos y contraseña para marcar tu asistencia.'}
              </p>

              <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-4">
                <div>
                  <label htmlFor="nombre" className="rotulo mb-1.5 block">
                    Nombres *
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="given-name"
                    value={nombre}
                    onChange={(e) => setNombre(limpiarNombre(e.target.value))}
                    placeholder="Juan Carlos"
                    className="campo"
                  />
                </div>

                <div>
                  <label htmlFor="apellidos" className="rotulo mb-1.5 block">
                    Apellidos *
                  </label>
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
                    placeholder="Quispe Huamán"
                    className="campo"
                  />
                </div>

                {esRegistro && (
                  <div>
                    <label className="rotulo mb-1.5 block">Tu usuario</label>
                    <div className="campo flex items-center justify-between gap-2 bg-ink-950 py-3">
                      <span className="truncate font-mono text-sm text-perla-200">
                        {usuarioSugerido}
                      </span>
                      <span className="shrink-0 text-xs text-perla-500">@asistencia.local</span>
                    </div>
                    <p className="mt-1.5 text-xs text-perla-400">
                      Así se llamará tu cuenta. Anótalo junto con tu contraseña.
                    </p>
                  </div>
                )}

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
                  {esRegistro && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={sugerirClave}
                        className="enlace text-xs"
                      >
                        Sugerir contraseña segura
                      </button>
                      {clave && (
                        <button
                          type="button"
                          onClick={copiarClave}
                          className="enlace text-xs"
                        >
                          {copiada ? 'Copiada ✓' : 'Copiar'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {esRegistro && (
                  <div>
                    <label htmlFor="repetirClave" className="rotulo mb-1.5 block">
                      Confirmar contraseña *
                    </label>
                    <CampoClave
                      id="repetirClave"
                      valor={repetirClave}
                      alCambiar={setRepetirClave}
                      autoComplete="new-password"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                )}

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
                  <button type="button" onClick={cambiarModo} className="enlace">
                    {esRegistro ? 'Ingresar' : 'Crear cuenta'}
                  </button>
                </p>
              </form>
            </motion.div>
          </AnimatePresence>
        </main>

        <p className="mt-5 text-center text-sm text-perla-300">
          ¿No puedes entrar? Avisa al coordinador de la institución.
        </p>

        <p className="mt-2 text-center text-xs leading-relaxed text-perla-400">
          Todos los campos son obligatorios · La fecha y hora se registran automáticamente
        </p>
      </div>
    </div>
  )
}

function mensajeDeError(fallo: unknown) {
  const mensaje = fallo instanceof Error ? fallo.message : 'Ocurrió un error, inténtalo otra vez.'

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
