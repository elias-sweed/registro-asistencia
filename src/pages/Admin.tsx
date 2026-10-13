import { useCallback, useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Chart01Icon,
  Home01Icon,
  Logout01Icon,
  Refresh01Icon,
  Table01Icon,
} from '@hugeicons/core-free-icons'
import Dock from '../components/Dock'
import type { DockItemData } from '../components/Dock'
import { Escudo, Ornamento } from '../components/Escudo'
import { GraficoBarras, GraficoColumnas, GraficoDona } from '../components/Graficos'
import type { Segmento } from '../components/Graficos'
import { useAuth } from '../context/authContext'
import { consultarPanel, esAdministrador } from '../lib/admin'
import { formatearFecha, textoPrograma, textoTurno } from '../lib/constantes'
import type { AdminDatos } from '../lib/types'
import { AccesoAdmin } from './AccesoAdmin'

const COLORES: Record<string, string> = {
  SENATI: '#c9a227',
  UCV: '#4a7fb5',
  DOCENTE_API: '#b32026',
  SIN_DATO: '#8b7d66',
}

type Filtro = 'todos' | 'marcaron' | 'pendientes'

type Fila = {
  correo: string
  nombres: string
  apellidos: string
  programa: string
  ciclo: number | null
  turno: string | null
  fecha: string | null
  creado_en: string
  estado: 'marcaron' | 'pendientes'
}

export function Admin() {
  const { sesion, cargando, correo, salir } = useAuth()
  const [permitido, setPermitido] = useState<boolean | null>(null)
  const [datos, setDatos] = useState<AdminDatos | null>(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [programaAbierto, setProgramaAbierto] = useState<string | null>(null)

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

  if (cargando || (sesion && permitido === null)) return <PantallaCarga />
  if (!sesion) return <AccesoAdmin />
  if (!permitido) return <SinPermiso correo={correo} salir={salir} />
  if (!datos) {
    return (
      <div className="fondo-ie relative flex min-h-screen items-center justify-center px-4">
        <div className="velo-ie" aria-hidden="true" />
        <div className="panel-vidrio relative w-full max-w-md rounded-2xl p-7 text-center">
          <p className="text-sm text-perla-200">{error || 'Cargando panel…'}</p>
          <button type="button" onClick={() => void cargar()} className="boton-oro mt-5">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <Panel
      datos={datos}
      correo={correo}
      error={error}
      filtro={filtro}
      setFiltro={setFiltro}
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      programaAbierto={programaAbierto}
      setProgramaAbierto={setProgramaAbierto}
      salir={salir}
      recargar={() => void cargar()}
    />
  )
}

function Panel({
  datos,
  correo,
  error,
  filtro,
  setFiltro,
  busqueda,
  setBusqueda,
  programaAbierto,
  setProgramaAbierto,
  salir,
  recargar,
}: {
  datos: AdminDatos
  correo: string
  error: string
  filtro: Filtro
  setFiltro: (v: Filtro) => void
  busqueda: string
  setBusqueda: (v: string) => void
  programaAbierto: string | null
  setProgramaAbierto: (v: string | null) => void
  salir: () => Promise<void>
  recargar: () => void
}) {
  const { resumen, por_programa, por_ciclo, por_dia, marcaron, pendientes } = datos

  const filas = useMemo<Fila[]>(() => {
    const marcadas: Fila[] = marcaron.map((f) => ({
      correo: f.correo,
      nombres: f.nombres,
      apellidos: f.apellidos,
      programa: f.programa,
      ciclo: f.ciclo,
      turno: f.turno,
      fecha: f.fecha,
      creado_en: f.fecha,
      estado: 'marcaron',
    }))
    const sinMarcar: Fila[] = pendientes.map((f) => ({
      correo: f.correo,
      nombres: f.nombres,
      apellidos: f.apellidos,
      programa: f.programa,
      ciclo: f.ciclo,
      turno: null,
      fecha: null,
      creado_en: f.creado_en,
      estado: 'pendientes',
    }))

    const base =
      filtro === 'marcaron'
        ? marcadas
        : filtro === 'pendientes'
          ? sinMarcar
          : [...marcadas, ...sinMarcar]

    const orden: Record<'marcaron' | 'pendientes', number> = { marcaron: 0, pendientes: 1 }
    const texto = busqueda.trim().toLowerCase()

    return base
      .filter((f) => {
        if (!texto) return true
        return (
          f.correo.toLowerCase().includes(texto) ||
          f.nombres.toLowerCase().includes(texto) ||
          f.apellidos.toLowerCase().includes(texto)
        )
      })
      .sort((a, b) => orden[a.estado] - orden[b.estado] || a.nombres.localeCompare(b.nombres))
  }, [marcaron, pendientes, filtro, busqueda])

  const segmentosPrograma: Segmento[] = por_programa.map((f) => ({
    etiqueta: textoPrograma(f.programa as never),
    valor: f.total,
    color: COLORES[f.programa] ?? '#8b7d66',
  }))

  const segmentosEstado: Segmento[] = [
    { etiqueta: 'Ya marcaron', valor: resumen.marcaron, color: '#c9a227' },
    { etiqueta: 'Sin marcar', valor: resumen.pendientes, color: '#b32026' },
  ]

  const ciclos = por_ciclo
    .filter((f) => f.ciclo > 0)
    .sort((a, b) => a.ciclo - b.ciclo)
    .map((f) => ({
      etiqueta: `Ciclo ${f.ciclo} · ${f.marcaron}/${f.total}`,
      valor: f.total,
      color: f.ciclo <= 6 ? '#c9a227' : '#4a7fb5',
    }))

  const dias = por_dia.map((f) => ({
    etiqueta: f.dia.slice(5).split('-').reverse().join('/'),
    valor: f.total,
  }))

  const porcentajeMarcaron =
    resumen.cuentas > 0 ? Math.round((resumen.marcaron / resumen.cuentas) * 100) : 0

  const scrollA = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itemsDock: DockItemData[] = [
    {
      icon: <HugeiconsIcon icon={Home01Icon} size={22} strokeWidth={1.8} />,
      label: 'Resumen',
      onClick: () => scrollA('resumen'),
    },
    {
      icon: <HugeiconsIcon icon={Chart01Icon} size={22} strokeWidth={1.8} />,
      label: 'Gráficos',
      onClick: () => scrollA('graficos'),
    },
    {
      icon: <HugeiconsIcon icon={Table01Icon} size={22} strokeWidth={1.8} />,
      label: 'Practicantes',
      badge: resumen.pendientes > 0 ? resumen.pendientes : undefined,
      onClick: () => scrollA('practicantes'),
    },
    {
      icon: <HugeiconsIcon icon={Refresh01Icon} size={22} strokeWidth={1.8} />,
      label: 'Actualizar',
      onClick: recargar,
    },
    {
      icon: <HugeiconsIcon icon={Logout01Icon} size={22} strokeWidth={1.8} />,
      label: 'Salir',
      onClick: () => void salir(),
    },
  ]

  return (
    <div className="fondo-ie relative min-h-screen pl-24 pr-4 py-8">
      <div className="velo-ie" aria-hidden="true" />

      <Dock
        items={itemsDock}
        position="left"
        theme="dark"
        baseItemSize={50}
        magnification={70}
        panelHeight={68}
        accentColor="#c9a227"
        badgeColor="#b32026"
        showLabels
        showIndicators
        showBadges
        bounce
        tiles
        distance={200}
        gap={10}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <Escudo alto="h-14" />
          <div>
            <p className="rotulo">Panel de control · Turno Tarde y Mañana</p>
            <h1 className="font-display text-2xl leading-tight font-semibold text-perla-50">
              Registro de Asistencia
            </h1>
            <p className="truncate text-sm text-perla-300">Administrador: {correo}</p>
          </div>
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-carmesi-400/40 bg-carmesi-500/10 px-3 py-2 text-sm text-perla-100">
            {error}
          </p>
        )}

        {/* Resumen */}
        <section id="resumen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-8">
          <Tarjeta rotulo="Cuentas creadas" valor={resumen.cuentas} detalle="Registradas en la app" />
          <Tarjeta
            rotulo="Ya marcaron"
            valor={resumen.marcaron}
            detalle={`${porcentajeMarcaron}% del total`}
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
        <section id="graficos" className="mt-6 grid gap-6 lg:grid-cols-2 scroll-mt-8">
          <article className="panel-vidrio rounded-xl p-6">
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

          <article className="panel-vidrio rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Marcaron vs. sin marcar
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoDona
                segmentos={segmentosEstado}
                centroValor={`${porcentajeMarcaron}%`}
                centroTexto="Marcaron"
              />
            </div>
          </article>

          <article className="panel-vidrio rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Cuentas por ciclo (marcaron / total)
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoBarras datos={ciclos} />
            </div>
          </article>

          <article className="panel-vidrio rounded-xl p-6">
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

        {/* Detalle por programa */}
        <section id="programas" className="panel-vidrio mt-6 rounded-xl p-6 scroll-mt-8">
          <h2 className="font-display text-lg font-semibold text-perla-50">
            Detalle por programa
          </h2>
          <div className="mt-3">
            <Ornamento />
          </div>

          <ul className="mt-5 space-y-2">
            {por_programa.map((fila) => {
              const abierto = programaAbierto === fila.programa
              const falta = fila.total - fila.marcaron
              return (
                <li key={fila.programa}>
                  <button
                    type="button"
                    onClick={() => setProgramaAbierto(abierto ? null : fila.programa)}
                    className="flex w-full items-center gap-3 rounded-lg border border-ink-700 bg-ink-950/50 px-4 py-3 text-left transition hover:border-oro-500/50"
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: COLORES[fila.programa] ?? '#8b7d66' }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-sm font-semibold text-perla-50">
                      {textoPrograma(fila.programa as never)}
                    </span>
                    <span className="font-mono text-xs text-perla-300">
                      {fila.marcaron} de {fila.total} marcaron
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        falta === 0
                          ? 'bg-oro-500/15 text-oro-400'
                          : 'bg-carmesi-500/15 text-carmesi-400'
                      }`}
                    >
                      {falta === 0 ? 'Completo' : `${falta} falta${falta === 1 ? '' : 'n'}`}
                    </span>
                    <span className="text-perla-400">{abierto ? '−' : '+'}</span>
                  </button>

                  {abierto && (
                    <ul className="mt-2 space-y-1 rounded-lg border border-ink-800 bg-ink-950/40 p-3">
                      {filas
                        .filter((f) => f.programa === fila.programa)
                        .map((f) => (
                          <li
                            key={f.correo}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="text-perla-200">
                              {f.nombres} {f.apellidos}
                              <span className="block text-[10px] text-perla-400">
                                {f.correo} · Ciclo {f.ciclo ?? '—'}
                              </span>
                            </span>
                            <span
                              className={
                                f.estado === 'marcaron'
                                  ? 'shrink-0 text-oro-400'
                                  : 'shrink-0 text-carmesi-400'
                              }
                            >
                              {f.estado === 'marcaron'
                                ? `Marcó · ${formatearFecha(f.fecha ?? '')}`
                                : 'Sin marcar'}
                            </span>
                          </li>
                        ))}
                      {filas.filter((f) => f.programa === fila.programa).length === 0 && (
                        <li className="text-xs text-perla-400">Sin practicantes.</li>
                      )}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* Tabla */}
        <section id="practicantes" className="panel-vidrio mt-6 rounded-xl p-6 scroll-mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Detalle de practicantes ({filas.length})
            </h2>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o usuario…"
              aria-label="Buscar practicante"
              className="campo w-full max-w-xs"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex gap-1 rounded-lg border border-ink-600 p-1">
              {(
                [
                  ['todos', `Todos (${marcaron.length + pendientes.length})`],
                  ['marcaron', `Marcaron (${marcaron.length})`],
                  ['pendientes', `Sin marcar (${pendientes.length})`],
                ] as [Filtro, string][]
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                    filtro === valor ? 'bg-oro-500 text-ink-950' : 'text-perla-300 hover:text-perla-50'
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Ornamento />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-perla-400">
                  <th className="rotulo px-2 py-2">Usuario</th>
                  <th className="rotulo px-2 py-2">Practicante</th>
                  <th className="rotulo px-2 py-2">Programa</th>
                  <th className="rotulo px-2 py-2">Ciclo</th>
                  <th className="rotulo px-2 py-2">Estado</th>
                  <th className="rotulo px-2 py-2">Cuenta creada</th>
                  <th className="rotulo px-2 py-2">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-perla-400">
                      No hay practicantes en esta vista.
                    </td>
                  </tr>
                )}
                {filas.map((f) => {
                  const completo = Boolean(f.nombres || f.apellidos)
                  const esMarcado = f.estado === 'marcaron'
                  return (
                    <tr key={f.correo} className="hover:bg-ink-850/40">
                      <td className="px-2 py-2.5 font-mono text-xs text-perla-200">{f.correo}</td>
                      <td className="px-2 py-2.5 text-perla-50">
                        {completo ? (
                          `${f.nombres} ${f.apellidos}`
                        ) : (
                          <span className="text-perla-400">Sin datos</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-perla-100">
                        {textoPrograma(f.programa as never)}
                      </td>
                      <td className="px-2 py-2.5 text-perla-100">{f.ciclo ?? '—'}</td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            esMarcado
                              ? 'bg-oro-500/15 text-oro-400'
                              : 'bg-carmesi-500/15 text-carmesi-400'
                          }`}
                        >
                          {esMarcado ? `Marcó · ${textoTurno('TARDE')}` : 'Sin marcar'}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-xs text-perla-300">
                        {f.creado_en ? formatearFecha(f.creado_en) : '—'}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-perla-300">
                        {esMarcado && f.fecha ? formatearFecha(f.fecha) : '—'}
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

function PantallaCarga() {
  return (
    <div className="fondo-ie relative flex min-h-screen items-center justify-center">
      <div className="velo-ie" aria-hidden="true" />
      <span className="relative h-9 w-9 animate-spin rounded-full border-2 border-oro-500 border-t-transparent" />
    </div>
  )
}

function SinPermiso({ correo, salir }: { correo: string; salir: () => Promise<void> }) {
  return (
    <div className="fondo-ie relative flex min-h-screen items-center justify-center px-4">
      <div className="velo-ie" aria-hidden="true" />
      <div className="panel-vidrio relative w-full max-w-md rounded-2xl p-7 text-center">
        <div className="flex justify-center">
          <Escudo alto="h-14" />
        </div>
        <p className="rotulo mt-4">Acceso restringido</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-perla-50">
          No eres administrador
        </h1>
        <p className="mt-2 text-sm text-perla-200">
          La cuenta <span className="font-mono text-xs">{correo}</span> no tiene permiso para ver
          el panel.
        </p>
        <p className="mt-3 text-xs text-perla-400">
          Para darte de alta, agrega tu correo en la tabla <code>administradores</code> de Supabase.
        </p>
        <button type="button" onClick={() => void salir()} className="boton-oro mt-5">
          Volver al inicio
        </button>
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
    <div className="panel-vidrio rounded-xl p-5">
      <p className="rotulo">{rotulo}</p>
      <p className="font-display mt-2 text-4xl font-semibold" style={{ color: acento }}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-perla-400">{detalle}</p>
    </div>
  )
}