import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MarcoAcceso } from '../components/MarcoAcceso'
import { useAuth } from '../context/authContext'
import { esAdministrador } from '../lib/admin'
import { supabase } from '../lib/supabase'
import fondo from '../assets/fondo/bosqueTenue.jpg'

/** Pantalla de acceso del panel, con el mismo diseño que el login de practicantes. */
export function AccesoAdmin() {
  const { correo: correoSesion } = useAuth()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError('')

    if (!correo.trim() || clave.length < 6) {
      setError('Completa tu usuario y contraseña.')
      return
    }

    setEnviando(true)
    const correoLimpio = correo.trim().toLowerCase()

    const { data, error: errorIngreso } = await supabase.auth.signInWithPassword({
      email: correoLimpio,
      password: clave,
    })

    if (errorIngreso || !data.session) {
      setError('Usuario o contraseña incorrectos.')
      setEnviando(false)
      return
    }

    const ok = await esAdministrador(data.session.user.email ?? '')
    if (!ok) {
      await supabase.auth.signOut()
      setError('Esa cuenta no tiene acceso al panel de administrador.')
      setEnviando(false)
      return
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <img
        src={fondo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none fixed inset-0 bg-ink-950/70" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <MarcoAcceso
          rotulo="Panel de control · Acceso restringido"
          titulo="Administración"
          subtitulo="Solo para docentes y coordinadores autorizados"
        />

        <main className="relative rounded-2xl border border-white/20 bg-white/5 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <form onSubmit={manejarEnvio} noValidate className="mt-2 space-y-5">
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
                className="peer w-full border-b-2 border-white/25 bg-transparent pt-5 pb-1.5 text-perla-50 outline-none transition-colors placeholder-transparent focus:border-oro-400"
              />
              <label
                htmlFor="correo-admin"
                className="pointer-events-none absolute top-5 left-0 text-sm text-perla-300/70 transition-all duration-300 peer-focus:-top-3 peer-focus:text-xs peer-focus:text-oro-400 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs"
              >
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
                className="peer w-full border-b-2 border-white/25 bg-transparent pt-5 pb-1.5 pr-10 text-perla-50 outline-none transition-colors placeholder-transparent focus:border-oro-400"
              />
              <label
                htmlFor="clave-admin"
                className="pointer-events-none absolute top-5 left-0 text-sm text-perla-300/70 transition-all duration-300 peer-focus:-top-3 peer-focus:text-xs peer-focus:text-oro-400 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs"
              >
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
              className="w-full rounded-xl bg-gradient-to-r from-oro-500 to-oro-400 py-3.5 font-semibold text-ink-950 shadow-lg shadow-oro-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-oro-500/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
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
          ¿Eres practicante?{' '}
          <Link to="/login" className="text-oro-400 transition hover:text-oro-300">
            Ingresa aquí
          </Link>
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