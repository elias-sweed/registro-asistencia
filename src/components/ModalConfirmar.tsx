import type { ReactNode } from 'react'

/** Pregunta antes de una acción que no se puede deshacer. */
export function ModalConfirmar({
  visible,
  titulo,
  descripcion,
  detalle,
  textoConfirmar = 'Sí, eliminar',
  textoCancelar = 'Cancelar',
  iconoPeligro = false,
  confirmando = false,
  onConfirmar,
  onCancelar,
}: {
  visible: boolean
  titulo: string
  descripcion: string
  detalle?: ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  iconoPeligro?: boolean
  confirmando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  if (!visible) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 px-4 backdrop-blur-sm"
    >
      <div
        className={`animate-[surgir_0.3s_ease-out] panel-admin w-full max-w-md rounded-2xl p-7 text-center ${
          iconoPeligro ? 'border-carmesi-400/50' : ''
        }`}
      >
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
            iconoPeligro
              ? 'border-carmesi-400 bg-carmesi-500/25'
              : 'border-carmesi-400/50 bg-carmesi-500/15'
          }`}
          aria-hidden="true"
        >
          <svg
            className="h-7 w-7 text-carmesi-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 001 1h10a1 1 0 001-1l1-13M9 7V4h6v3" />
          </svg>
        </span>

        <h2 className="font-display mt-4 text-xl leading-snug font-semibold text-perla-50">
          {titulo}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-perla-200">{descripcion}</p>

        {detalle && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-perla-300">
            {detalle}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirmar}
            disabled={confirmando}
            className="boton-rojo flex-1 rounded-xl py-3 disabled:opacity-60"
          >
            {confirmando ? 'Eliminando…' : textoConfirmar}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={confirmando}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-perla-200 transition hover:border-oro-500/60 hover:text-oro-400 disabled:opacity-60"
          >
            {textoCancelar}
          </button>
        </div>
      </div>
    </div>
  )
}