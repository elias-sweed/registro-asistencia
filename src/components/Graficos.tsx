export type Segmento = {
  etiqueta: string
  valor: number
  color: string
}

/** Dona con leyenda lateral. */
export function GraficoDona({
  segmentos,
  centroValor,
  centroTexto,
}: {
  segmentos: Segmento[]
  centroValor: string
  centroTexto: string
}) {
  const total = segmentos.reduce((suma, s) => suma + s.valor, 0)
  const radio = 62
  const circunferencia = 2 * Math.PI * radio
  let acumulado = 0

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative shrink-0">
        <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label={centroTexto}>
          <circle
            cx="84"
            cy="84"
            r={radio}
            fill="none"
            stroke="var(--color-ink-700)"
            strokeWidth="26"
          />
          {total > 0 &&
            segmentos.map((segmento) => {
              const proporcion = segmento.valor / total
              const largo = proporcion * circunferencia
              const desfase = -acumulado * circunferencia
              acumulado += proporcion
              if (segmento.valor === 0) return null
              return (
                <circle
                  key={segmento.etiqueta}
                  cx="84"
                  cy="84"
                  r={radio}
                  fill="none"
                  stroke={segmento.color}
                  strokeWidth="26"
                  strokeDasharray={`${largo} ${circunferencia - largo}`}
                  strokeDashoffset={desfase}
                  transform="rotate(-90 84 84)"
                  strokeLinecap="butt"
                />
              )
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold text-perla-50">{centroValor}</span>
          <span className="rotulo mt-1">{centroTexto}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {segmentos.map((segmento) => {
          const porcentaje = total > 0 ? Math.round((segmento.valor / total) * 100) : 0
          return (
            <li key={segmento.etiqueta} className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm"
                style={{ backgroundColor: segmento.color }}
                aria-hidden="true"
              />
              <span className="flex-1 text-sm text-perla-100">{segmento.etiqueta}</span>
              <span className="font-mono text-sm text-perla-50">{segmento.valor}</span>
              <span className="w-12 text-right font-mono text-xs text-perla-400">
                {porcentaje}%
              </span>
            </li>
          )
        })}
        {total === 0 && (
          <li className="text-sm text-perla-400">Todavía no hay cuentas creadas.</li>
        )}
      </ul>
    </div>
  )
}

/** Barras horizontales con valor a la derecha. */
export function GraficoBarras({
  datos,
  color = 'var(--color-oro-500)',
}: {
  datos: { etiqueta: string; valor: number; color?: string }[]
  color?: string
}) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor))

  if (datos.length === 0) {
    return <p className="text-sm text-perla-400">Sin datos todavía.</p>
  }

  return (
    <ul className="space-y-3">
      {datos.map((dato) => (
        <li key={dato.etiqueta}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-sm text-perla-100">{dato.etiqueta}</span>
            <span className="font-mono text-sm text-perla-50">{dato.valor}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(dato.valor / maximo) * 100}%`, backgroundColor: dato.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Barras verticales para los últimos días. */
export function GraficoColumnas({
  datos,
  color = 'var(--color-oro-500)',
}: {
  datos: { etiqueta: string; valor: number }[]
  color?: string
}) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor))

  if (datos.length === 0) {
    return <p className="text-sm text-perla-400">Aún no hay registros de asistencia.</p>
  }

  return (
    <div>
      <div className="flex h-40 items-end gap-2">
        {datos.map((dato) => (
          <div key={dato.etiqueta} className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-xs text-perla-50">{dato.valor}</span>
            <div
              className="w-full rounded-t transition-[height] duration-500"
              style={{
                height: `${Math.max(4, (dato.valor / maximo) * 120)}px`,
                backgroundColor: color,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-ink-700 pt-2">
        {datos.map((dato) => (
          <span
            key={dato.etiqueta}
            className="flex-1 truncate text-center text-[10px] text-perla-400"
          >
            {dato.etiqueta}
          </span>
        ))}
      </div>
    </div>
  )
}