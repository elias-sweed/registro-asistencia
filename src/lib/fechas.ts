/** Fechas en la zona horaria de la I.E (America/Lima), igual que la base de datos. */
const ZONA = 'America/Lima'

export type ClaveDia = 'hoy' | 'ayer' | 'anteayer' | 'otro'

const DIA_MS = 86_400_000

/** Devuelve YYYY-MM-DD de una fecha dentro de la zona de la institución. */
function aClave(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function hoyEnLima(): string {
  return aClave(new Date().toISOString())
}

/** Cuántos días han pasado desde esa fecha hasta hoy (0 = hoy, 1 = ayer). */
export function diasDesde(iso: string, hoy = hoyEnLima()): number {
  const destino = Date.parse(`${hoy}T00:00:00Z`)
  const origen = Date.parse(`${aClave(iso)}T00:00:00Z`)
  return Math.round((destino - origen) / DIA_MS)
}

export function claveDia(iso: string | null | undefined, hoy = hoyEnLima()): ClaveDia | null {
  if (!iso) return null
  const dias = diasDesde(iso, hoy)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias === 2) return 'anteayer'
  return 'otro'
}

const formatearHora = new Intl.DateTimeFormat('es', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const formatearDia = new Intl.DateTimeFormat('es', {
  timeZone: ZONA,
  day: '2-digit',
  month: 'short',
})

const formatearDiaLargo = new Intl.DateTimeFormat('es', {
  timeZone: ZONA,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

/** "Hoy · 09:15", "Ayer · 08:02", "13 oct · 07:58" */
export function fechaCorta(iso: string | null | undefined) {
  if (!iso) return '—'
  const hora = formatearHora.format(new Date(iso))
  const clave = claveDia(iso)
  if (clave === 'hoy') return `Hoy · ${hora}`
  if (clave === 'ayer') return `Ayer · ${hora}`
  if (clave === 'anteayer') return `Anteayer · ${hora}`
  return `${formatearDia.format(new Date(iso))} · ${hora}`
}

/** Igual que fechaCorta pero con el día de la semana: "lun, 13 oct · 07:58" */
export function fechaConDia(iso: string | null | undefined) {
  if (!iso) return '—'
  const clave = claveDia(iso)
  const hora = formatearHora.format(new Date(iso))
  if (clave === 'hoy') return `Hoy · ${hora}`
  if (clave === 'ayer') return `Ayer · ${hora}`
  if (clave === 'anteayer') return `Anteayer · ${hora}`
  return `${formatearDiaLargo.format(new Date(iso))} · ${hora}`
}