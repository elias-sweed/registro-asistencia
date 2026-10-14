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

const MESES = new Intl.DateTimeFormat('es', { timeZone: ZONA, month: 'long' })

/** "9:05 A.M." o "2:47 P.M." (las 00:00 salen como 12:00 A.M.). */
export function hora12(iso: string): string {
  // hour y minute deben pedirse juntos: por separado el minuto no sale con
  // dos digitos y terminaba en "12:0 A.M." en vez de "12:00 A.M.".
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))

  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? '0')
  const minuto = partes.find((p) => p.type === 'minute')?.value ?? '00'
  const h12 = hora % 12 === 0 ? 12 : hora % 12
  return `${h12}:${minuto} ${hora < 12 ? 'A.M.' : 'P.M.'}`
}

/**
 * Día en palabras: "Hoy", "Ayer 13", "Ayer 11 de octubre",
 * "11 de octubre", "11 de octubre de 2024".
 */
export function diaEnPalabras(iso: string, hoy = hoyEnLima()): string {
  const fecha = new Date(iso)
  const dias = diasDesde(iso, hoy)
  const prefijo =
    dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : dias === 2 ? 'Anteayer' : null

  const dia = Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONA, day: '2-digit' }).format(fecha))
  const mes = MESES.format(fecha)
  const ahora = new Date()
  const mesActual = MESES.format(ahora)
  const anio = Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONA, year: 'numeric' }).format(fecha))
  const anioActual = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: ZONA, year: 'numeric' }).format(ahora),
  )

  if (prefijo) {
    if (mes === mesActual && anio === anioActual) return `${prefijo} ${dia}`
    return `${prefijo} ${dia} de ${mes}`
  }

  if (anio === anioActual) return `${dia} de ${mes}`
  return `${dia} de ${mes} de ${anio}`
}

/** "Hoy" / "Ayer 13" / "11 de octubre" junto con la hora en A.M. o P.M. */
export function fechaDetallada(iso: string | null | undefined) {
  if (!iso) return { dia: '—', hora: '' }
  return { dia: diaEnPalabras(iso), hora: hora12(iso) }
}

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