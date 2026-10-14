import { useState } from 'react'

const ZONA = 'America/Lima'

/** Lima es UTC-5 todo el año (no cambia el horario de verano). */
const DESFASE_LIMA = '-05:00'

function partesDe(iso: string) {
  const d = new Date(iso)
  const fecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return { fecha, hora }
}

/** Elige la fecha y hora de una asistencia. Solo lo usa el administrador. */
export function ModalEditarFecha({
  visible,
  correo,
  nombre,
  fechaActual,
  guardando,
  onGuardar,
  onCancelar,
}: {
  visible: boolean
  correo: string
  nombre: string
  fechaActual: string | null
  guardando: boolean
  onGuardar: (iso: string) => void
  onCancelar: () => void
}) {
  // El padre pone key={correo}, asi que al cambiar de fila el componente se
  // remonta y estos valores parten de la fecha guardada, sin necesidad de un
  // efecto que los actualice despues de pintar.
  const inicial = () => partesDe(fechaActual ?? new Date().toISOString())
  const [fecha, setFecha] = useState(inicial().fecha)
  const [hora, setHora] = useState(inicial().hora)

  if (!visible) return null

  function confirmar() {
    if (!fecha || !hora) return
    // 'YYYY-MM-DDTHH:mm-05:00' es una hora de Lima precisa.
    onGuardar(new Date(`${fecha}T${hora}:00${DESFASE_LIMA}`).toISOString())
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Corregir la fecha de la asistencia"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 px-4 backdrop-blur-sm"
    >
      <div className="panel-admin w-full max-w-md rounded-2xl p-7">
        <h2 className="font-display text-xl leading-snug font-semibold text-perla-50">
          Corregir fecha y hora
        </h2>
        <p className="mt-2 text-sm text-perla-200">
          Para <strong className="text-perla-50">{nombre}</strong>
        </p>
        <p className="mt-1 font-mono text-xs text-perla-400">{correo}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="rotulo mb-1.5 block">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="campo"
            />
          </label>
          <label className="block">
            <span className="rotulo mb-1.5 block">Hora</span>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="campo"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-perla-400">
          La hora que escribas es la de Tarapoto (Lima).
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando || !fecha || !hora}
            className="boton-oro flex-1 rounded-xl py-3 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-perla-200 transition hover:border-oro-500/60 hover:text-oro-400 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}