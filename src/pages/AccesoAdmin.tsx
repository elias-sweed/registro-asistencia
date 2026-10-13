import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CampoClave } from '../components/CampoClave'
import { MarcoAcceso } from '../components/MarcoAcceso'
import { useAuth } from '../context/authContext'
import { esAdministrador } from '../lib/admin'
import { supabase } from '../lib/supabase'

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
      <div className="textura pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <MarcoAcceso
          rotulo="Panel de control · Acceso restringido"
          titulo="Administración"
          subtitulo="Solo para docentes y coordinadores autorizados"
        />

        <main className="panel rounded-xl p-7">
          <h2 className="font-display text-center text-xl font-semibold text-perla-50">
            Ingresar al panel
          </h2>
          <p className="mt-1 text-center text-sm text-perla-300">
            Usa el usuario con el que creaste la cuenta en Supabase.
          </p>

          <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="correo-admin" className="rotulo mb-1.5 block">
                Usuario o correo *
              </label>
              <input
                id="correo-admin"
                name="correo-admin"
                type="text"
                required
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="admin@ie.edu.pe"
                className="campo"
              />
            </div>

            <div>
              <label htmlFor="clave-admin" className="rotulo mb-1.5 block">
                Contraseña *
              </label>
              <CampoClave
                id="clave-admin"
                valor={clave}
                alCambiar={setClave}
                autoComplete="current-password"
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
              ) : (
                'Entrar al panel'
              )}
            </button>
          </form>
        </main>

        <p className="mt-5 text-center text-sm text-perla-300">
          ¿Eres practicante?{' '}
          <Link to="/login" className="enlace">
            Ingresa aquí
          </Link>
        </p>

        {correoSesion && (
          <p className="mt-2 text-center text-xs text-perla-400">
            Sesión actual: {correoSesion}
          </p>
        )}
      </div>
    </div>
  )
}