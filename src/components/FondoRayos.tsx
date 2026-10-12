import LightRays from './LightRays'

/** Fondo animado con rayos de luz, en tonos oro del tema vintage. */
export function FondoRayos() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 opacity-45">
        <LightRays
          raysOrigin="top-center"
          raysColor="#c9a227"
          raysSpeed={0.7}
          lightSpread={0.65}
          rayLength={2.6}
          followMouse={true}
          mouseInfluence={0.12}
          noiseAmount={0.05}
          distortion={0.15}
          fadeDistance={0.9}
          saturation={0.85}
          pulsating={false}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/85 to-ink-950" />
    </div>
  )
}