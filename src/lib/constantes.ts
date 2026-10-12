import type { Programa, Turno } from './types'

export type OpcionPrograma = {
  valor: Programa
  texto: string
  ciclos: number[]
  aplicaCiclo: boolean
}

export const PROGRAMAS: OpcionPrograma[] = [
  { valor: 'SENATI', texto: 'SENATI', ciclos: [1, 2, 3, 4, 5, 6], aplicaCiclo: true },
  {
    valor: 'UCV',
    texto: 'UCV',
    ciclos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    aplicaCiclo: true,
  },
  { valor: 'DOCENTE_API', texto: 'Docente API', ciclos: [], aplicaCiclo: false },
]

export function buscarPrograma(valor: Programa | '' | null) {
  return PROGRAMAS.find((p) => p.valor === valor)
}

export function textoPrograma(valor: Programa | null | undefined) {
  return buscarPrograma(valor ?? null)?.texto ?? '-'
}

export function ciclosDe(valor: Programa | '') {
  return buscarPrograma(valor)?.ciclos ?? []
}

export function aplicaCiclo(valor: Programa | '') {
  return buscarPrograma(valor)?.aplicaCiclo ?? false
}

export const TURNOS: { valor: Turno; texto: string }[] = [
  { valor: 'MANANA', texto: 'Mañana' },
  { valor: 'TARDE', texto: 'Tarde' },
]

export function textoTurno(turno: Turno | null) {
  return TURNOS.find((t) => t.valor === turno)?.texto ?? '-'
}

const formatoFecha = new Intl.DateTimeFormat('es', {
  dateStyle: 'long',
  timeStyle: 'short',
})

export function formatearFecha(iso: string | Date) {
  const fecha = typeof iso === 'string' ? new Date(iso) : iso
  return formatoFecha.format(fecha)
}