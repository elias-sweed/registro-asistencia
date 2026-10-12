import FuzzyText from './FuzzyText'

export function ModalBloqueo({
  visible,
  titulo,
  descripcion,
  detalle,
  pie,
  textoBoton = 'Entendido',
  onCerrar,
}: {
  visible: boolean
  titulo: string
  descripcion: string
  detalle?: React.ReactNode
  pie?: string
  textoBoton?: string
  onCerrar: () => void
}) {
  if (!visible) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Error: ${titulo}`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 px-4 backdrop-blur-sm"
    >
      <div className="animate-[surgir_0.35s_ease-out] relative w-full max-w-md overflow-hidden rounded-xl border-2 border-carmesi-400/70 bg-gradient-to-b from-carmesi-500/15 via-ink-900 to-ink-950 p-7 text-center shadow-[0_0_60px_-15px_rgba(179,32,38,0.8)]">
        <div className="textura pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative">
          <span role="img" aria-label="ERROR" className="block">
            <FuzzyText
              color="#ff5a60"
              fontSize="clamp(2.5rem, 11vw, 4rem)"
              fontWeight={900}
              fontFamily="'Playfair Display', Georgia, serif"
              baseIntensity={0.16}
              hoverIntensity={0.55}
              clickEffect
              enableHover
              fuzzRange={30}
              fps={60}
              direction="both"
              glitchMode
              glitchInterval={1800}
              glitchDuration={220}
              letterSpacing={6}
              className="mx-auto block"
            >
              ERROR
            </FuzzyText>
          </span>

          <div className="mt-4 h-px w-28 mx-auto bg-gradient-to-r from-transparent via-carmesi-400 to-transparent" />

          <h2 className="font-display mt-4 text-2xl leading-snug font-semibold text-perla-50">
            {titulo}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-perla-200">{descripcion}</p>

          {detalle && (
            <div className="mt-4 rounded-lg border border-ink-600 bg-ink-950/80 px-4 py-3 text-sm text-perla-300">
              {detalle}
            </div>
          )}

          {pie && <p className="mt-4 text-xs text-perla-400">{pie}</p>}

          <button type="button" onClick={onCerrar} className="boton-rojo mt-5">
            {textoBoton}
          </button>
        </div>
      </div>
    </div>
  )
}