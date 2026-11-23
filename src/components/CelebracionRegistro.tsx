import { useEffect, useState } from 'react'

export function CelebracionRegistro({
  visible,
  nombre,
  programa,
  onCerrar,
  duracion = 5000,
}: {
  visible: boolean
  nombre: string
  programa: string
  onCerrar: () => void
  duracion?: number
}) {
  const [segundos, setSegundos] = useState(5)

  useEffect(() => {
    if (!visible) return
    let restante = Math.ceil(duracion / 1000)
    setSegundos(restante)

    const tick = setInterval(() => {
      restante -= 1
      setSegundos(restante)
      if (restante <= 0) {
        clearInterval(tick)
        onCerrar()
      }
    }, 1000)

    return () => clearInterval(tick)
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-white px-4"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl p-8 text-center bg-white shadow-2xl border border-slate-200"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Check grande estilo Google Forms */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-9 w-9 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Asistencia registrada
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Tu asistencia ha sido registrada con éxito.
        </p>

        <p className="font-medium text-slate-700 mb-1">{nombre}</p>
        <p className="text-sm text-slate-500 mb-6">{programa}</p>

        <p className="text-xs text-slate-400">
          Volviendo al inicio en {segundos}…
        </p>
      </div>
    </div>
  )
}
