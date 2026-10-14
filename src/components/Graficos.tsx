import { useMemo, useState } from 'react'

export type Segmento = {
  etiqueta: string
  valor: number
  color: string
}

export type BarraDato = {
  etiqueta: string
  valor: number
  color?: string
  /** Texto secundario, por ejemplo "3 de 5 marcaron". */
  detalle?: string
}

/** Dona interactiva: cada elemento de la leyenda se puede apagar y encender. */
export function GraficoDona({
  segmentos,
  centroValor,
  centroTexto,
}: {
  segmentos: Segmento[]
  centroValor: string
  centroTexto: string
}) {
  const [ocultos, setOcultos] = useState<string[]>([])
  const [encima, setEncima] = useState<string | null>(null)

  const visibles = useMemo(
    () => segmentos.filter((s) => !ocultos.includes(s.etiqueta)),
    [segmentos, ocultos],
  )
const total = visibles.reduce((suma, s) => suma + s.valor, 0)
  const radio = 62
  const circunferencia = 2 * Math.PI * radio

  // Los offsets se calculan antes de dibujar, sin mutar nada.
  const arcos = useMemo(
    () =>
      visibles.map((segmento, indice) => {
        const proporcion = total > 0 ? segmento.valor / total : 0
        const previo =
          visibles
            .slice(0, indice)
            .reduce((suma, s) => suma + s.valor, 0) / Math.max(1, total)
        return {
          segmento,
          largo: proporcion * circunferencia,
          desfase: -previo * circunferencia,
        }
      }),
    [visibles, total, circunferencia],
  )

  function alternar(etiqueta: string) {
    setOcultos((previos) =>
      previos.includes(etiqueta)
        ? previos.filter((e) => e !== etiqueta)
        : [...previos, etiqueta],
    )
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <div className="relative shrink-0">
          <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label={centroTexto}>
            <circle cx="84" cy="84" r={radio} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="26" />
            {total > 0 &&
              arcos.map(({ segmento, largo, desfase }) => {
                if (segmento.valor === 0) return null
                const activo = encima === segmento.etiqueta
                // Un pequeño hueco entre cada porcion las separa.
                const largoVisible = Math.max(0, largo - 3)
                return (
                  <circle
                    key={segmento.etiqueta}
                    cx="84"
                    cy="84"
                    r={radio}
                    fill="none"
                    stroke={segmento.color}
                    strokeWidth={activo ? 32 : 26}
                    strokeDasharray={`${largoVisible} ${circunferencia - largoVisible + 3}`}
                    strokeDashoffset={desfase}
                    transform="rotate(-90 84 84)"
                    strokeLinecap="butt"
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setEncima(segmento.etiqueta)}
                    onMouseLeave={() => setEncima(null)}
                    onClick={() => alternar(segmento.etiqueta)}
                  >
                    <title>{`${segmento.etiqueta}: ${segmento.valor}`}</title>
                  </circle>
                )
              })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-semibold text-perla-50">{centroValor}</span>
            <span className="rotulo mt-1">{centroTexto}</span>
          </div>
        </div>

        <ul className="w-full space-y-1.5">
          {segmentos.map((segmento) => {
            const oculto = ocultos.includes(segmento.etiqueta)
            const base = ocultos.length === 0 ? segmentos.length : visibles.length
            const porcentaje =
              base > 0 ? Math.round((segmento.valor / Math.max(1, segmentosTotal(segmentos))) * 100) : 0
            return (
              <li key={segmento.etiqueta}>
                <button
                  type="button"
                  onClick={() => alternar(segmento.etiqueta)}
                  onMouseEnter={() => setEncima(segmento.etiqueta)}
                  onMouseLeave={() => setEncima(null)}
                  aria-pressed={!oculto}
                  title={oculto ? 'Clic para volver a mostrar' : 'Clic para ocultar'}
                  className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition ${
                    oculto
                      ? 'border-transparent opacity-45 hover:opacity-70'
                      : 'border-transparent hover:border-white/15 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: segmento.color, opacity: oculto ? 0.4 : 1 }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-sm text-perla-100">{segmento.etiqueta}</span>
                  <span className="font-mono text-sm text-perla-50">{segmento.valor}</span>
                  <span className="w-11 text-right font-mono text-xs text-perla-400">
                    {porcentaje}%
                  </span>
                </button>
              </li>
            )
          })}
          {segmentosTotal(segmentos) === 0 && (
            <li className="text-sm text-perla-400">Todavía no hay cuentas creadas.</li>
          )}
        </ul>
      </div>

      {ocultos.length > 0 && (
        <button
          type="button"
          onClick={() => setOcultos([])}
          className="mt-3 text-xs font-medium text-oro-400 transition hover:text-oro-300"
        >
          Mostrar los {ocultos.length} elemento{ocultos.length === 1 ? '' : 's'} oculto
          {ocultos.length === 1 ? '' : 's'}
        </button>
      )}
    </div>
  )
}

function segmentosTotal(segmentos: Segmento[]) {
  return segmentos.reduce((suma, s) => suma + s.valor, 0)
}

/** Barras horizontales. Clic en una fila para apagarla o encenderla. */
export function GraficoBarras({
  datos,
  color = 'var(--color-oro-500)',
}: {
  datos: BarraDato[]
  color?: string
}) {
  const [ocultos, setOcultos] = useState<string[]>([])
  const [encima, setEncima] = useState<string | null>(null)

  const visibles = datos.filter((d) => !ocultos.includes(d.etiqueta))
  const maximo = Math.max(1, ...visibles.map((d) => d.valor))

  function alternar(etiqueta: string) {
    setOcultos((previos) =>
      previos.includes(etiqueta)
        ? previos.filter((e) => e !== etiqueta)
        : [...previos, etiqueta],
    )
  }

  if (datos.length === 0) return <p className="text-sm text-perla-400">Sin datos todavía.</p>

  return (
    <div>
      <ul className="space-y-2.5">
        {datos.map((dato) => {
          const oculto = ocultos.includes(dato.etiqueta)
          const activo = encima === dato.etiqueta
          return (
            <li key={dato.etiqueta}>
              <button
                type="button"
                onClick={() => alternar(dato.etiqueta)}
                onMouseEnter={() => setEncima(dato.etiqueta)}
                onMouseLeave={() => setEncima(null)}
                aria-pressed={!oculto}
                title={oculto ? 'Clic para volver a mostrar' : 'Clic para ocultar'}
                className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                  oculto
                    ? 'border-transparent opacity-45 hover:opacity-70'
                    : 'border-transparent hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-perla-100">{dato.etiqueta}</span>
                  <span className="flex items-baseline gap-2">
                    {dato.detalle && (
                      <span className="text-xs text-perla-400">{dato.detalle}</span>
                    )}
                    <span className="font-mono text-sm text-perla-50">{dato.valor}</span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-[width,filter] duration-500"
                    style={{
                      width: oculto ? 0 : `${(dato.valor / maximo) * 100}%`,
                      backgroundColor: dato.color ?? color,
                      filter: activo && !oculto ? 'brightness(1.25)' : 'none',
                    }}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {ocultos.length > 0 && (
        <button
          type="button"
          onClick={() => setOcultos([])}
          className="mt-3 text-xs font-medium text-oro-400 transition hover:text-oro-300"
        >
          Mostrar los {ocultos.length} oculto{ocultos.length === 1 ? '' : 's'}
        </button>
      )}
    </div>
  )
}

/** Columnas por día. Clic en un día para apagarlo o encenderlo. */
export function GraficoColumnas({
  datos,
  color = 'var(--color-oro-500)',
  destacarUltimo = false,
}: {
  datos: { etiqueta: string; valor: number }[]
  color?: string
  destacarUltimo?: boolean
}) {
  const [ocultos, setOcultos] = useState<string[]>([])
  const [encima, setEncima] = useState<string | null>(null)

  const visibles = datos.filter((d) => !ocultos.includes(d.etiqueta))
  const maximo = Math.max(1, ...visibles.map((d) => d.valor))

  function alternar(etiqueta: string) {
    setOcultos((previos) =>
      previos.includes(etiqueta)
        ? previos.filter((e) => e !== etiqueta)
        : [...previos, etiqueta],
    )
  }

  if (datos.length === 0)
    return <p className="text-sm text-perla-400">Aún no hay registros de asistencia.</p>

  return (
    <div>
      <div className="flex h-44 items-end gap-1.5">
        {datos.map((dato, indice) => {
          const oculto = ocultos.includes(dato.etiqueta)
          const activo = encima === dato.etiqueta
          const ultimo = destacarUltimo && indice === datos.length - 1
          const alto = Math.max(3, (dato.valor / maximo) * 128)
          return (
            <button
              key={dato.etiqueta}
              type="button"
              onClick={() => alternar(dato.etiqueta)}
              onMouseEnter={() => setEncima(dato.etiqueta)}
              onMouseLeave={() => setEncima(null)}
              aria-pressed={!oculto}
              title={`${dato.etiqueta}: ${dato.valor} registros. Clic para ${oculto ? 'mostrar' : 'ocultar'}`}
              className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-0 bg-transparent p-0"
            >
              <span
                className={`font-mono text-xs transition ${
                  activo && !oculto ? 'text-oro-300' : 'text-perla-50'
                } ${oculto ? 'opacity-40' : ''}`}
              >
                {oculto ? '·' : dato.valor}
              </span>
              <span
                className="w-full rounded-t transition-[height,filter] duration-500"
                style={{
                  height: `${oculto ? 3 : alto}px`,
                  backgroundColor: color,
                  opacity: oculto ? 0.25 : 1,
                  filter: activo && !oculto ? 'brightness(1.3)' : 'none',
                  outline: ultimo && !oculto ? '1px solid rgba(201,162,39,0.55)' : 'none',
                }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 border-t border-white/10 pt-2">
        {datos.map((dato, indice) => (
          <span
            key={dato.etiqueta}
            className={`flex-1 truncate text-center text-[10px] ${
              ocultos.includes(dato.etiqueta) ? 'text-perla-700' : 'text-perla-400'
            } ${destacarUltimo && indice === datos.length - 1 ? 'font-semibold text-oro-400' : ''}`}
          >
            {dato.etiqueta}
          </span>
        ))}
      </div>

      {ocultos.length > 0 && (
        <button
          type="button"
          onClick={() => setOcultos([])}
          className="mt-3 text-xs font-medium text-oro-400 transition hover:text-oro-300"
        >
          Mostrar los {ocultos.length} día{ocultos.length === 1 ? '' : 's'} oculto
          {ocultos.length === 1 ? '' : 's'}
        </button>
      )}
    </div>
  )
}