import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Escudo } from './Escudo'
import { fechaConDia } from '../lib/fechas'
import { textoPrograma, textoTurno } from '../lib/constantes'

export type FilaReporte = {
  correo: string
  nombres: string
  apellidos: string
  programa: string
  ciclo: number | null
  turno: string | null
  fecha: string | null
  estado: 'marcaron' | 'pendientes'
}

/**
 * Documento que se imprime o guarda como PDF.
 * Solo se ve al imprimir: en pantalla el CSS lo oculta.
 */
export function ReporteImpresion({
  filas,
  tituloFiltro,
}: {
  filas: FilaReporte[]
  tituloFiltro: string
}) {
  const marcadas = useMemo(() => filas.filter((f) => f.estado === 'marcaron'), [filas])
  const pendientes = useMemo(() => filas.filter((f) => f.estado === 'pendientes'), [filas])

  const nombreDe = (f: FilaReporte) =>
    f.nombres || f.apellidos ? `${f.nombres} ${f.apellidos}`.trim() : f.correo

  const generado = new Intl.DateTimeFormat('es', {
    timeZone: 'America/Lima',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  // Se monta fuera de #root para que al imprimir se pueda esconder toda la
  // aplicacion y dejar solo el reporte, sin saltos ni posiciones raras.
  const contenido = (
    <div className="reporte-impresion">
      <header className="flex items-center gap-4 border-b-2 border-black/15 pb-4">
        <Escudo alto="h-14" />
        <div>
          <p className="text-sm font-semibold">I.E Jimenez Pimentel</p>
          <h1 className="text-xl font-bold">Registro de Asistencia</h1>
          <p className="text-xs">
            Practicantes y docentes · Turnos Mañana y Tarde — Tarapoto
          </p>
        </div>
      </header>

      <p className="mt-3 text-xs">
        <strong>Fecha del reporte:</strong> {generado} (hora de Lima)
        <br />
        <strong>Mostrando:</strong> {tituloFiltro}
      </p>

      <section className="mt-6">
        <h2 className="text-base font-bold">
          Sí registraron su asistencia ({marcadas.length})
        </h2>
        <table className="reporte-tabla mt-2">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Programa</th>
              <th>Ciclo</th>
              <th>Turno</th>
              <th>Fecha y hora</th>
              <th>Firma</th>
            </tr>
          </thead>
          <tbody>
            {marcadas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center italic">
                  Nadie ha registrado asistencia con este filtro.
                </td>
              </tr>
            )}
            {marcadas.map((f, i) => (
              <tr key={f.correo}>
                <td>{i + 1}</td>
                <td className="izquierda">{nombreDe(f)}</td>
                <td>{textoPrograma(f.programa as never)}</td>
                <td>{f.ciclo ? f.ciclo : '—'}</td>
                <td>{f.turno ? textoTurno(f.turno) : '—'}</td>
                <td>{fechaConDia(f.fecha)}</td>
                <td className="firma">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-bold">
          Todavía NO han registrado su asistencia ({pendientes.length})
        </h2>
        <table className="reporte-tabla mt-2">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Programa</th>
              <th>Ciclo</th>
              <th>Correo con el que entró</th>
              <th>Firma</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center italic">
                  Todos los que aparecen en este reporte ya registraron su asistencia.
                </td>
              </tr>
            )}
            {pendientes.map((f, i) => (
              <tr key={f.correo}>
                <td>{i + 1}</td>
                <td className="izquierda">{nombreDe(f)}</td>
                <td>{textoPrograma(f.programa as never)}</td>
                <td>{f.ciclo ? f.ciclo : '—'}</td>
                <td>{f.correo}</td>
                <td className="firma">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="firmas mt-10">
        <div className="linea-firma">
          <span className="raya">&nbsp;</span>
          <span className="nombre">Manuel</span>
        </div>
        <div className="linea-firma">
          <span className="raya">&nbsp;</span>
          <span className="nombre">Edward</span>
        </div>
      </div>
      <p className="mt-1 text-center text-xs">Manuel y Edward</p>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(contenido, document.body)
}