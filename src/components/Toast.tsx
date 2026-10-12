import { useEffect } from 'react'

export type ToastTipo = 'exito' | 'error'

export function Toast({
  mensaje,
  tipo,
  onCerrar,
  duracion = 4500,
}: {
  mensaje: string
  tipo: ToastTipo
  onCerrar: () => void
  duracion?: number
}) {
  useEffect(() => {
    const id = window.setTimeout(onCerrar, duracion)
    return () => window.clearTimeout(id)
  }, [mensaje, tipo, duracion, onCerrar])

  const esExito = tipo === 'exito'

  return (
    <div className="fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`panel animate-[toast_0.25s_ease-out] flex w-full max-w-md items-start gap-3 rounded-lg border-l-2 px-4 py-3 ${
          esExito ? 'border-l-oro-500' : 'border-l-carmesi-400'
        }`}
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            esExito ? 'bg-oro-500/15' : 'bg-carmesi-500/15'
          }`}
        >
          {esExito ? (
            <svg className="h-3.5 w-3.5 text-oro-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.79 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 text-carmesi-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 012 0v5a1 1 0 11-2 0V5zm1 10a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>

        <p className="flex-1 text-sm leading-relaxed text-perla-50">{mensaje}</p>

        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="rounded p-1 text-perla-400 transition hover:text-oro-400"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  )
}