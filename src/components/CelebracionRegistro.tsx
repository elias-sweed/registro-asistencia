import { useEffect } from 'react'
import ASCIIText from './ASCIIText'

const FUENTE_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', ui-monospace, monospace"

export function CelebracionRegistro({
  visible,
  nombre,
  programa,
  onCerrar,
  duracion = 7000,
}: {
  visible: boolean
  nombre: string
  programa: string
  onCerrar: () => void
  duracion?: number
}) {
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(onCerrar, duracion)
    return () => window.clearTimeout(id)
  }, [visible, duracion, onCerrar])

  useEffect(() => {
    if (!visible) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [visible, onCerrar])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Asistencia registrada"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/90 px-4 backdrop-blur-sm"
      onPointerDown={onCerrar}
    >
      <div
        className="panel animate-[surgir_0.45s_ease-out] relative w-full max-w-lg overflow-hidden rounded-xl p-7 text-center"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="rotulo">Asistencia registrada</p>

        <div className="relative mx-auto mt-4 h-[220px] w-full sm:h-[280px]">
          <ASCIIText
            text="BIEN HECHO"
            asciiFontSize={7}
            fontFamily={FUENTE_MONO}
            fontWeight={700}
            textColor="#f7f2e8"
            colors={['#c9a227', '#b32026', '#ecd9a0']}
            textScale={0.95}
            blocks={0.55}
            waves={0.7}
            waveSpeed={1.1}
            chroma={0.7}
            tilt={0.9}
            hueShift={0.35}
            scramble={0.6}
            clickRipple
            idle
            interactive
          />
        </div>

        <h2 className="font-display mt-3 text-2xl font-semibold text-perla-50">{nombre}</h2>
        <p className="mt-1 text-sm text-perla-300">{programa}</p>

        <div className="mt-5 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-oro-500 to-transparent" />

        <p className="mt-4 text-xs text-perla-400">
          Mueve el cursor sobre las letras y haz clic para ver la onda.
        </p>

        <button type="button" onClick={onCerrar} className="boton-oro mt-5">
          Volver al formulario
        </button>
      </div>
    </div>
  )
}