import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { CampoClave } from '../components/CampoClave'
import { Escudo, Ornamento } from '../components/Escudo'
import { FondoRayos } from '../components/FondoRayos'
import { useAuth } from '../context/authContext'
import { esAdministrador } from '../lib/admin'
import { supabase } from '../lib/supabase'
import { correoDesdeCodigo, validarClave, validarCodigo } from '../lib/validacion'

type Modo = 'ingresar' | 'registrar'

export function Login() {
  const { sesion, cargando } = useAuth()
  const [modo, setModo] = useState<Modo>('ingresar')
  const [codigo, setCodigo] = useState('')
  const [clave, setClave] = useState('')
  const [repetirClave, setRepetirClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
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
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
      </div>
    )
  }

  if (sesion) return <Navigate to={esAdmin ? '/login/admin' : '/registro'} replace />

  const esRegistro = modo === 'registrar'

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError('')

    const errorCodigo = validarCodigo(codigo)
    if (errorCodigo) {
      setError(errorCodigo)
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
    const correoInterno = correoDesdeCodigo(codigo)

    try {
      if (esRegistro) {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email: correoInterno,
          password: clave,
        })
        if (
          errorRegistro &&
          !/already been registered|already registered/i.test(errorRegistro.message)
        )
          throw errorRegistro

        // Si ya existe ese codigo, se entra directamente con la misma clave.
        if (data?.session) return

        const { error: errorIngreso } = await supabase.auth.signInWithPassword({
          email: correoInterno,
          password: clave,
        })
        if (errorIngreso) throw errorIngreso
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
          <h2 className="font-display text-center text-xl font-semibold text-perla-50">
            {esRegistro ? 'Crear cuenta de practicante' : 'Ingresar'}
          </h2>
          <p className="mt-1 text-center text-sm text-perla-300">
            {esRegistro
              ? 'Elige tu código y una contraseña. Tu cuenta queda lista al instante.'
              : 'Escribe tu código y contraseña para marcar tu asistencia.'}
          </p>

          <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="codigo" className="rotulo mb-1.5 block">
                Tu código *
              </label>
              <input
                id="codigo"
                name="codigo"
                type="text"
                required
                minLength={3}
                maxLength={40}
                autoComplete="username"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="PE-2026"
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
              <button
                type="button"
                onClick={() => {
                  setModo(esRegistro ? 'ingresar' : 'registrar')
                  setRepetirClave('')
                  setError('')
                }}
                className="enlace"
              >
                {esRegistro ? 'Ingresar' : 'Crear cuenta'}
              </button>
            </p>
          </form>
        </main>

        <p className="mt-5 text-center text-xs leading-relaxed text-perla-400">
          Todos los campos son obligatorios · La fecha y hora se registran automáticamente
        </p>
      </div>
    </div>
  )
}

function mensajeDeError(fallo: unknown) {
  const mensaje = fallo instanceof Error ? fallo.message : 'Ocurrió un error, inténtalo otra vez.'

  if (/Invalid login credentials/i.test(mensaje)) return 'Código o contraseña incorrectos.'
  if (/User already registered|already been registered/i.test(mensaje))
    return 'Ese código ya está registrado. Ingresa con tu contraseña.'
  if (/Password should be at least/i.test(mensaje))
    return 'La contraseña debe tener al menos 6 caracteres.'
  return mensaje
}