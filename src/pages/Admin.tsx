import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Escudo, Ornamento } from '../components/Escudo'
import { FondoRayos } from '../components/FondoRayos'
import { GraficoBarras, GraficoColumnas, GraficoDona } from '../components/Graficos'
import type { Segmento } from '../components/Graficos'
import { useAuth } from '../context/authContext'
import { consultarPanel, esAdministrador } from '../lib/admin'
import { formatearFecha, textoPrograma, textoTurno } from '../lib/constantes'
import type { AdminDatos } from '../lib/types'

const COLORES: Record<string, string> = {
  SENATI: '#c9a227',
  UCV: '#4a7fb5',
  DOCENTE_API: '#b32026',
  SIN_DATO: '#8b7d66',
}

type Filtro = 'todos' | 'marcaron' | 'pendientes'

export function Admin() {
  const { sesion, cargando, correo, salir } = useAuth()
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [datos, setDatos] = useState<AdminDatos | null>(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const cargar = useCallback(async () => {
    const ok = await esAdministrador(correo)
    setPermitido(ok)
    if (!ok) return
    try {
      setDatos(await consultarPanel())
      setError('')
    } catch {
      setError('No se pudieron cargar los datos del panel.')
    }
  }, [correo])

  useEffect(() => {
    if (!sesion) return
    let vivo = true
    ;(async () => {
      const ok = await esAdministrador(correo)
      if (!vivo) return
      setPermitido(ok)
      if (!ok) return
      try {
        setDatos(await consultarPanel())
        setError('')
      } catch {
        setError('No se pudieron cargar los datos del panel.')
      }
    })()
    return () => {
      vivo = false
    }
  }, [sesion, correo])

  if (cargando || (sesion && permitido === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
      </div>
    )
  }

  if (!sesion) return <Navigate to="/login" replace />

  if (!permitido) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <FondoRayos />
        <div className="panel relative w-full max-w-md rounded-xl p-7 text-center">
          <div className="flex justify-center">
            <Escudo alto="h-14" />
          </div>
          <p className="rotulo mt-4">Acceso restringido</p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-perla-50">
            No eres administrador
          </h1>
          <p className="mt-2 text-sm text-perla-200">
            Esta cuenta ({correo}) no tiene permiso para ver el panel de control.
          </p>
          <button type="button" onClick={() => void salir()} className="boton-oro mt-5">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <FondoRayos />
        <div className="panel relative w-full max-w-md rounded-xl p-7 text-center">
          <p className="text-sm text-perla-200">{error || 'Cargando panel…'}</p>
          <button
            type="button"
            onClick={() => void cargar()}
            className="boton-oro mt-5"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { resumen, por_programa, por_ciclo, por_dia, marcaron, pendientes } = datos

  const segmentosPrograma: Segmento[] = por_programa.map((fila) => ({
    etiqueta: textoPrograma(fila.programa as never),
    valor: fila.total,
    color: COLORES[fila.programa] ?? '#8b7d66',
  }))

  const segmentosEstado: Segmento[] = [
    { etiqueta: 'Ya marcaron', valor: resumen.marcaron, color: '#c9a227' },
    { etiqueta: 'Sin marcar', valor: resumen.pendientes, color: '#b32026' },
  ]

  const ciclos = por_ciclo
    .filter((f) => f.ciclo > 0)
    .sort((a, b) => a.ciclo - b.ciclo)
    .map((f) => ({
      etiqueta: `Ciclo ${f.ciclo}`,
      valor: f.total,
      color: f.ciclo <= 6 ? '#c9a227' : '#4a7fb5',
    }))

  const dias = por_dia.map((f) => ({
    etiqueta: f.dia.slice(5).split('-').reverse().join('/'),
    valor: f.total,
  }))

  const filas =
    filtro === 'marcaron'
      ? marcaron.map((f) => ({ ...f, estado: 'marcaron' as const }))
      : filtro === 'pendientes'
        ? pendientes.map((f) => ({ ...f, estado: 'pendientes' as const }))
        : [
            ...marcaron.map((f) => ({ ...f, estado: 'marcaron' as const })),
            ...pendientes.map((f) => ({ ...f, estado: 'pendientes' as const })),
          ]

  return (
    <div className="relative min-h-screen px-4 py-8">
      <FondoRayos />
      <div className="textura pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <Escudo alto="h-14" />
            <div>
              <p className="rotulo">Panel de control · Turno Tarde</p>
              <h1 className="font-display text-2xl leading-tight font-semibold text-perla-50">
                Registro de Asistencia
              </h1>
              <p className="truncate text-sm text-perla-300">{correo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void salir()}
            className="shrink-0 rounded border border-ink-600 bg-ink-900/70 px-3 py-2 text-xs font-semibold tracking-[0.14em] text-perla-200 uppercase transition hover:border-oro-500/60 hover:text-oro-400"
          >
            Salir
          </button>
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-carmesi-400/40 bg-carmesi-500/10 px-3 py-2 text-sm text-perla-100">
            {error}
          </p>
        )}

        {/* Resumen */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta rotulo="Cuentas creadas" valor={resumen.cuentas} detalle="Se registraron en la app" />
          <Tarjeta
            rotulo="Ya marcaron"
            valor={resumen.marcaron}
            detalle="Asistencia registrada"
            acento="var(--color-oro-500)"
          />
          <Tarjeta
            rotulo="Sin marcar"
            valor={resumen.pendientes}
            detalle="Todavía no registran"
            acento="var(--color-carmesi-400)"
          />
          <Tarjeta rotulo="Marcaron hoy" valor={resumen.hoy} detalle="Registros de hoy" />
        </section>

        {/* Gráficos */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="panel rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Cuentas por programa
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoDona
                segmentos={segmentosPrograma}
                centroValor={String(resumen.cuentas)}
                centroTexto="Cuentas"
              />
            </div>
          </article>

          <article className="panel rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Marcaron vs. sin marcar
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoDona
                segmentos={segmentosEstado}
                centroValor={`${resumen.cuentas > 0 ? Math.round((resumen.marcaron / resumen.cuentas) * 100) : 0}%`}
                centroTexto="Marcaron"
              />
            </div>
          </article>

          <article className="panel rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-perla-50">Cuentas por ciclo</h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoBarras datos={ciclos} />
            </div>
          </article>

          <article className="panel rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Registros por día
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoColumnas datos={dias} />
            </div>
          </article>
        </section>

        {/* Tabla */}
        <section className="panel mt-6 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              practicantes ({filas.length})
            </h2>
            <div className="flex gap-1 rounded-lg border border-ink-600 p-1">
              {(
                [
                  ['todos', 'Todos'],
                  ['marcaron', `Marcaron (${marcaron.length})`],
                  ['pendientes', `Sin marcar (${pendientes.length})`],
                ] as [Filtro, string][]
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                    filtro === valor
                      ? 'bg-oro-500 text-ink-950'
                      : 'text-perla-300 hover:text-perla-50'
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Ornamento />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-perla-400">
                  <th className="rotulo px-2 py-2">Correo</th>
                  <th className="rotulo px-2 py-2">Practicante</th>
                  <th className="rotulo px-2 py-2">Programa</th>
                  <th className="rotulo px-2 py-2">Ciclo</th>
                  <th className="rotulo px-2 py-2">Estado</th>
                  <th className="rotulo px-2 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-perla-400">
                      No hay practicantes en esta vista.
                    </td>
                  </tr>
                )}
                {filas.map((fila) => {
                  const completo = [fila.nombres, fila.apellidos].some(Boolean)
                  const esMarcado = fila.estado === 'marcaron'
                  return (
                    <tr key={fila.correo} className="hover:bg-ink-850/40">
                      <td className="px-2 py-2.5 font-mono text-xs text-perla-200">{fila.correo}</td>
                      <td className="px-2 py-2.5 text-perla-50">
                        {completo ? (
                          `${fila.nombres} ${fila.apellidos}`
                        ) : (
                          <span className="text-perla-400">Sin datos</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-perla-100">
                        {textoPrograma(fila.programa as never)}
                      </td>
                      <td className="px-2 py-2.5 text-perla-100">
                        {fila.ciclo !== null ? fila.ciclo : '—'}
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            esMarcado
                              ? 'bg-oro-500/15 text-oro-400'
                              : 'bg-carmesi-500/15 text-carmesi-400'
                          }`}
                        >
                          {esMarcado ? `Marcó · ${textoTurno(fila.turno ?? null)}` : 'Sin marcar'}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-xs text-perla-300">
                        {formatearFecha(esMarcado ? fila.fecha : fila.creado_en)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-perla-400">
          El registro es una sola vez por practicante y por navegador.
        </p>
      </div>
    </div>
  )
}

function Tarjeta({
  rotulo,
  valor,
  detalle,
  acento = 'var(--color-perla-50)',
}: {
  rotulo: string
  valor: number
  detalle: string
  acento?: string
}) {
  return (
    <div className="panel rounded-xl p-5">
      <p className="rotulo">{rotulo}</p>
      <p className="font-display mt-2 text-4xl font-semibold" style={{ color: acento }}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-perla-400">{detalle}</p>
    </div>
  )
}