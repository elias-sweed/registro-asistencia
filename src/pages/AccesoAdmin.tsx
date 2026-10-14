import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MarcoAcceso } from '../components/MarcoAcceso'
import { useAuth } from '../context/authContext'
import { esAdministrador } from '../lib/admin'
import { supabase } from '../lib/supabase'

/** Pantalla de acceso del panel, con el mismo diseño que el login de practicantes. */
export function AccesoAdmin() {
  const navegar = useNavigate()
  const { correo: correoSesion } = useAuth()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError('')

    if (!correo.trim() || clave.length < 6) {
      setError('Completa tu correo y contraseña.')
      return
    }

    setEnviando(true)
    const correoLimpio = correo.trim().toLowerCase()

    const { data, error: errorIngreso } = await supabase.auth.signInWithPassword({
      email: correoLimpio,
      password: clave,
    })

    if (errorIngreso || !data.session) {
      setError(
        /Invalid login credentials/i.test(leerMensaje(errorIngreso))
          ? 'Correo o contraseña incorrectos.'
          : `No se pudo entrar: ${leerMensaje(errorIngreso)}`,
      )
      setEnviando(false)
      return
    }

    const ok = await esAdministrador(data.session.user.email ?? '')
    if (!ok) {
      await supabase.auth.signOut()
      setError(
        `La cuenta ${correoLimpio} existe pero no tiene acceso al panel. Agrégala en la tabla administradores de Supabase o entra con la cuenta del coordinador.`,
      )
      setEnviando(false)
      return
    }

    // Entramos al panel.
    navegar('/admin', { replace: true })
  }

  return (
    <div className="fondo-ie relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="velo-ie" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <MarcoAcceso
          rotulo="I.E Jimenez Pimentel"
          titulo="Administración"
          subtitulo="Panel de control · Acceso restringido"
        />

        <main className="panel-vidrio rounded-2xl p-7 sm:p-9">
          <form onSubmit={manejarEnvio} noValidate className="mt-2 space-y-6">
            <div className="relative">
              <input
                id="correo-admin"
                name="correo-admin"
                type="text"
                required
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder=" "
                className="campo-flotante"
              />
              <label htmlFor="correo-admin" className="etiqueta-flotante">
                Usuario o correo *
              </label>
            </div>

            <div className="relative">
              <input
                id="clave-admin"
                name="clave-admin"
                type="password"
                required
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder=" "
                className="campo-flotante pr-10"
              />
              <label htmlFor="clave-admin" className="etiqueta-flotante">
                Contraseña *
              </label>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('clave-admin') as HTMLInputElement
                  input.type = input.type === 'password' ? 'text' : 'password'
                }}
                aria-label="Ver contraseña"
                title="Ver contraseña"
                className="absolute top-4 right-0 rounded p-1.5 text-perla-300/60 transition hover:text-oro-400 focus:text-oro-400 focus:outline-none"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" strokeLinecap="round" />
                </svg>
              </button>
            </div>

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
              ) : (
                'Entrar al panel'
              )}
            </button>
          </form>
        </main>

        <p className="mt-5 text-center text-sm text-perla-300/60">
          ¿Eres practicante? Cierra esta página y entra por el inicio.
        </p>

        {correoSesion && (
          <p className="mt-2 text-center text-xs text-perla-400/50">
            Sesión actual: {correoSesion}
          </p>
        )}
      </div>
    </div>
  )
}

/** Los errores de Supabase no siempre son instancias de Error. */
function leerMensaje(fallo: unknown): string {
  if (!fallo) return 'error desconocido'
  if (typeof fallo === 'string') return fallo
  if (fallo instanceof Error) return fallo.message
  if (typeof fallo === 'object' && 'message' in fallo)
    return String((fallo as { message?: unknown }).message ?? 'error desconocido')
  return 'error desconocido'
}