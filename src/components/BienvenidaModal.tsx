import { useEffect } from 'react'
import { Escudo } from './Escudo'
import SplitFlapText from './SplitFlapText'

export function BienvenidaModal({
  visible,
  detalle,
  duracion = 2600,
  onCerrar,
}: {
  visible: boolean
  detalle: string
  duracion?: number
  onCerrar: () => void
}) {
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(onCerrar, duracion)
    return () => window.clearTimeout(id)
  }, [visible, duracion, onCerrar])

  if (!visible) return null

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Bienvenido"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/88 px-4 backdrop-blur-sm"
    >
      <div className="panel textura animate-[surgir_0.4s_ease-out] relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-xl px-7 py-10 text-center">
        <Escudo alto="h-16" />

        <div className="mt-5 w-full overflow-hidden">
          <SplitFlapText
            words={['BIENVENIDO', 'HOLA PRACTICANTE']}
            flipDuration={0.1}
            stagger={0.04}
            cycleDelay={650}
            charset="alphanumeric"
            flipsPerChar={5}
            tileColor="#12121b"
            textColor="#dcbe6e"
            tileRadius={6}
            gap={5}
            fontSize={17}
            padTo={15}
            loop
            className="mx-auto"
          />
        </div>

        <p className="mt-4 text-sm text-perla-300">{detalle}</p>

        <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-oro-500 to-transparent" />

        <div className="mt-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oro-500" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oro-500 [animation-delay:0.2s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oro-500 [animation-delay:0.4s]" />
        </div>

        <p className="mt-3 text-xs tracking-[0.2em] text-perla-400 uppercase">
          Cargando formulario…
        </p>
      </div>
    </div>
  )
}