import { Escudo } from '../components/Escudo'

export function SinConfigurar() {
  return (
    <div className="fondo-ie flex min-h-screen items-center justify-center px-4">
      <div className="velo-ie" aria-hidden="true" />

      <div className="panel-vidrio relative w-full max-w-lg rounded-2xl p-7 text-center">
        <div className="flex justify-center">
          <Escudo alto="h-16" />
        </div>

        <p className="rotulo mt-4">Configuración pendiente</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-perla-50">
          Falta conectar con Supabase
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-perla-200">
          Crea el archivo <code className="text-oro-400">.env.local</code> en la raíz del proyecto
          con tus credenciales y reinicia el servidor:
        </p>

        <pre className="mt-4 overflow-x-auto rounded-lg border border-white/15 bg-black/40 p-4 text-left text-xs text-perla-200">
          {`VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon`}
        </pre>

        <p className="mt-4 text-sm text-perla-300">
          Las encuentras en <span className="text-perla-50">Supabase → Project Settings → API</span>.
        </p>
      </div>
    </div>
  )
}