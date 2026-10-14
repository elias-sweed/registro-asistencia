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
import { textoPrograma, textoTurno } from '../lib/constantes'
import { claveDia, diasDesde, fechaConDia, fechaCorta, hoyEnLima } from '../lib/fechas'
import type { AdminDatos } from '../lib/types'
import { AccesoAdmin } from './AccesoAdmin'

const COLORES: Record<string, string> = {
  SENATI: '#c9a227',
  UCV: '#4a7fb5',
  DOCENTE_API: '#b32026',
  SIN_DATO: '#8b7d66',
}

const COLORES_TURNO: Record<string, string> = {
  'Mañana': '#4a7fb5',
  'Tarde': '#c9a227',
}

type Filtro = 'todos' | 'marcaron' | 'pendientes'

type FiltroDia = 'todo' | 'hoy' | 'ayer' | 'anteayer' | 'semana'

type FiltroPrograma = 'TODOS' | 'SENATI' | 'UCV' | 'DOCENTE_API'

const OPCIONES_DIA: { valor: FiltroDia; texto: string }[] = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: 'ayer', texto: 'Ayer' },
  { valor: 'anteayer', texto: 'Antes de ayer' },
  { valor: 'semana', texto: 'Últimos 7 días' },
  { valor: 'todo', texto: 'Todo' },
]

const OPCIONES_PROGRAMA_FILTRO: { valor: FiltroPrograma; texto: string }[] = [
  { valor: 'TODOS', texto: 'Todos' },
  { valor: 'SENATI', texto: 'SENATI' },
  { valor: 'UCV', texto: 'UCV' },
  { valor: 'DOCENTE_API', texto: 'Docentes' },
]

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
  const [dia, setDia] = useState<FiltroDia>('todo')
  const [programaCiclo, setProgramaCiclo] = useState<FiltroPrograma>('TODOS')
  const [busqueda, setBusqueda] = useState('')

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
        <div className="panel-admin relative w-full max-w-md rounded-2xl p-7 text-center">
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
      dia={dia}
      setDia={setDia}
      programaCiclo={programaCiclo}
      setProgramaCiclo={setProgramaCiclo}
      busqueda={busqueda}
      setBusqueda={setBusqueda}
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
  dia,
  setDia,
  programaCiclo,
  setProgramaCiclo,
  busqueda,
  setBusqueda,
  salir,
  recargar,
}: {
  datos: AdminDatos
  correo: string
  error: string
  filtro: Filtro
  setFiltro: (v: Filtro) => void
  dia: FiltroDia
  setDia: (v: FiltroDia) => void
  programaCiclo: FiltroPrograma
  setProgramaCiclo: (v: FiltroPrograma) => void
  busqueda: string
  setBusqueda: (v: string) => void
  salir: () => Promise<void>
  recargar: () => void
}) {
  const { resumen, por_programa, por_dia, marcaron, pendientes } = datos

  const filasBase = useMemo<Fila[]>(() => {
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

  // El filtro de dia solo aplica a quienes SI marcaron: los que siguen
  // pendientes todavia no tienen fecha de registro.
  const filas = useMemo<Fila[]>(() => {
    if (dia === 'todo') return filasBase

    return filasBase
      .filter((f) => {
        if (!f.fecha) return false
        const clave = claveDia(f.fecha)
        if (dia === 'semana') return diasDesde(f.fecha) <= 6
        return clave === dia
      })
      .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
  }, [filasBase, dia])

  const conteoDia = useMemo(() => {
    const cuenta: Record<string, number> = { todo: filasBase.length }
    const hoy = hoyEnLima()
    for (const f of filasBase) {
      if (!f.fecha) continue
      const clave = claveDia(f.fecha, hoy)
      if (clave) cuenta[clave] = (cuenta[clave] ?? 0) + 1
      if (diasDesde(f.fecha, hoy) <= 6) cuenta.semana = (cuenta.semana ?? 0) + 1
    }
    return cuenta
  }, [filasBase])

  const segmentosPrograma: Segmento[] = por_programa.map((f) => ({
    etiqueta: textoPrograma(f.programa as never),
    valor: f.total,
    color: COLORES[f.programa] ?? '#8b7d66',
  }))

  const segmentosEstado: Segmento[] = [
    { etiqueta: 'Ya marcaron', valor: resumen.marcaron, color: '#c9a227' },
    { etiqueta: 'Sin marcar', valor: resumen.pendientes, color: '#b32026' },
  ]

// Las cuentas por ciclo se cuentan aqui para poder separar por programa:
  // la base de datos agrupa por ciclo, no por ciclo y programa a la vez.
  const ciclos = useMemo(() => {
    const cuentas = new Map<number, { total: number; marcaron: number }>()

    for (const fila of [...marcaron, ...pendientes]) {
      if (programaCiclo !== 'TODOS' && fila.programa !== programaCiclo) continue
      const numero = fila.ciclo
      if (!numero || numero < 1) continue
      const actual = cuentas.get(numero) ?? { total: 0, marcaron: 0 }
      actual.total += 1
      if ('fecha' in fila && fila.fecha) actual.marcaron += 1
      cuentas.set(numero, actual)
    }

    return [...cuentas.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ciclo, dato]) => ({
        etiqueta: `Ciclo ${ciclo}`,
        valor: dato.total,
        detalle: `${dato.marcaron} de ${dato.total} marcaron`,
        color: ciclo <= 6 ? '#c9a227' : '#4a7fb5',
      }))
  }, [marcaron, pendientes, programaCiclo])

  const dias = por_dia.map((f) => ({
    etiqueta: f.dia.slice(5).split('-').reverse().join('/'),
    valor: f.total,
  }))

  // La asistencia por turno se cuenta aqui porque cada registro marcado ya
  // trae su turno.
  const porTurno = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const fila of marcaron) {
      const clave = textoTurno(fila.turno)
      cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1)
    }
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([etiqueta, valor]) => ({
        etiqueta,
        valor,
        color: COLORES_TURNO[etiqueta] ?? '#8b7d66',
      }))
  }, [marcaron])

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
    <div className="fondo-ie relative min-h-screen px-4 pt-8 pb-40">
      <div className="velo-ie" aria-hidden="true" />

      <Dock
        items={itemsDock}
        position="bottom"
        theme="dark"
        style={{ position: 'fixed' }}
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
            <p className="rotulo">Panel de control · Turnos Mañana y Tarde</p>
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
        <section id="resumen" className="grid scroll-mt-8 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <section id="graficos" className="mt-6 grid scroll-mt-8 gap-6 lg:grid-cols-2">
          <article className="panel-admin rounded-xl p-6">
            <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
              ¿Cuántas personas registraron su asistencia y cuántas no?
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

          <article className="panel-admin rounded-xl p-6">
            <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
              ¿Cuántas cuentas hay por programa?
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

          <article className="panel-admin rounded-xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
                ¿Cuántas cuentas hay en cada ciclo?
              </h2>
              <div className="flex shrink-0 flex-wrap gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
                {OPCIONES_PROGRAMA_FILTRO.map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setProgramaCiclo(opcion.valor)}
                    aria-pressed={programaCiclo === opcion.valor}
                    className={`cursor-pointer rounded px-2.5 py-1 text-xs font-semibold transition ${
                      programaCiclo === opcion.valor
                        ? 'bg-oro-500 text-ink-950'
                        : 'text-perla-300 hover:text-perla-50'
                    }`}
                  >
                    {opcion.texto}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <Ornamento />
            </div>
            {programaCiclo !== 'TODOS' && (
              <p className="mt-2 text-xs text-perla-400">
                Mostrando solo{' '}
                <strong className="text-oro-400">
                  {textoPrograma(programaCiclo as never)}
                </strong>{' '}
                · {ciclos.reduce((suma, c) => suma + c.valor, 0)} en total
              </p>
            )}
            <div className="mt-5">
              <GraficoBarras datos={ciclos} />
            </div>
          </article>

          <article className="panel-admin rounded-xl p-6">
            <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
              ¿Cuántos han asistido en cada turno?
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              {porTurno.length > 0 ? (
                <GraficoBarras datos={porTurno} />
              ) : (
                <p className="text-sm text-perla-400">
                  Todavía nadie ha registrado asistencia.
                </p>
              )}
            </div>
          </article>

          <article className="panel-admin rounded-xl p-6 lg:col-span-2">
            <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
              ¿Cuántas personas registraron su asistencia cada día?
            </h2>
            <div className="mt-3">
              <Ornamento />
            </div>
            <div className="mt-5">
              <GraficoColumnas datos={dias} destacarUltimo />
            </div>
          </article>
        </section>

        {/* Detalle por programa */}
        <section id="programas" className="panel-admin mt-6 rounded-xl p-6 scroll-mt-8">
          <h2 className="font-display text-lg font-semibold text-perla-50">Avance por programa</h2>
          <div className="mt-3">
            <Ornamento />
          </div>

          <ul className="mt-5 space-y-4">
            {por_programa.map((fila) => {
              const falta = fila.total - fila.marcaron
              const avance = fila.total > 0 ? Math.round((fila.marcaron / fila.total) * 100) : 0
              const color = COLORES[fila.programa] ?? '#8b7d66'
              return (
                <li key={fila.programa}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-perla-50">
                      {textoPrograma(fila.programa as never)}
                    </span>
                    <span className="font-mono text-xs text-perla-300">
                      {fila.marcaron} de {fila.total}
                    </span>
                    <span className="font-mono text-xs text-perla-400">{avance}%</span>
                    <span
                      className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        falta === 0
                          ? 'bg-oro-500/15 text-oro-400'
                          : 'bg-carmesi-500/15 text-carmesi-400'
                      }`}
                    >
                      {falta === 0
                        ? 'Completo'
                        : `${falta} sin marcar${falta === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${avance}%`, backgroundColor: color }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Tabla */}
        <section id="practicantes" className="panel-admin mt-6 rounded-xl p-6 scroll-mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-perla-50">
              Detalle de practicantes · {filas.length}
            </h2>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo…"
              aria-label="Buscar practicante"
              className="campo w-full max-w-xs"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
            <div>
              <p className="rotulo mb-1.5">Estado</p>
              <div className="flex flex-wrap gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
                {(
                  [
                    ['todos', `Todos ${marcaron.length + pendientes.length}`],
                    ['marcaron', `Marcaron ${marcaron.length}`],
                    ['pendientes', `Sin marcar ${pendientes.length}`],
                  ] as [Filtro, string][]
                ).map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltro(valor)}
                    aria-pressed={filtro === valor}
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

            <div>
              <p className="rotulo mb-1.5">Día de la asistencia</p>
              <div className="flex flex-wrap gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
                {OPCIONES_DIA.map((opcion) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setDia(opcion.valor)}
                    aria-pressed={dia === opcion.valor}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                      dia === opcion.valor
                        ? 'bg-oro-500 text-ink-950'
                        : 'text-perla-300 hover:text-perla-50'
                    }`}
                  >
                    {opcion.texto}
                    <span className="ml-1.5 opacity-70">{conteoDia[opcion.valor] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {dia !== 'todo' && (
            <p className="mt-3 text-xs text-perla-400">
              Mostrando solo quienes{' '}
              <strong className="text-oro-400">marcaron asistencia</strong> ese día. Quienes
              todavía no marcan no aparecen.
            </p>
          )}

          <div className="mt-4">
            <Ornamento />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="rotulo px-2 py-2.5">Practicante</th>
                  <th className="rotulo px-2 py-2.5">Programa</th>
                  <th className="rotulo px-2 py-2.5">Ciclo</th>
                  <th className="rotulo px-2 py-2.5">Turno</th>
                  <th className="rotulo px-2 py-2.5">Estado</th>
                  <th className="rotulo px-2 py-2.5">
                    <span title="Cuándo se creó la cuenta en la aplicación">Creó cuenta</span>
                  </th>
                  <th className="rotulo px-2 py-2.5">
                    <span title="Cuándo registró su asistencia">Marcó asistencia</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-8 text-center text-perla-400">
                      {dia === 'todo'
                        ? 'No hay practicantes que cumplan este filtro.'
                        : 'Nadie registró asistencia ese día.'}
                    </td>
                  </tr>
                )}
                {filas.map((f) => {
                  const completo = Boolean(f.nombres || f.apellidos)
                  const esMarcado = f.estado === 'marcaron'
                  return (
                    <tr key={f.correo} className="hover:bg-white/5">
                      <td className="px-2 py-3">
                        <span className="block font-medium text-perla-50">
                          {completo ? `${f.nombres} ${f.apellidos}` : 'Sin datos'}
                        </span>
                        <span className="block font-mono text-[11px] text-perla-400">
                          {f.correo}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-perla-100">
                        {textoPrograma(f.programa as never)}
                      </td>
                      <td className="px-2 py-3 text-perla-100">
                        {f.ciclo === null || f.ciclo === 0 ? '—' : f.ciclo}
                      </td>
                      <td className="px-2 py-3 text-perla-100">
                        {esMarcado ? textoTurno(f.turno) : '—'}
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            esMarcado
                              ? 'bg-oro-500/15 text-oro-400'
                              : 'bg-carmesi-500/15 text-carmesi-400'
                          }`}
                        >
                          {esMarcado ? 'Marcó' : 'Sin marcar'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs whitespace-nowrap text-perla-300">
                        {fechaCorta(f.creado_en)}
                      </td>
                      <td
                        className={`px-2 py-3 text-xs whitespace-nowrap ${
                          esMarcado ? 'font-semibold text-oro-400' : 'text-perla-400'
                        }`}
                      >
                        {esMarcado && f.fecha ? fechaConDia(f.fecha) : 'Aún no marca'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

<p className="mt-6 text-center text-xs text-perla-400">
            Cada practicante registra su asistencia una sola vez. Las horas corresponden a Lima.
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
  const [cambiando, setCambiando] = useState(false)

  return (
    <div className="fondo-ie relative flex min-h-screen items-center justify-center px-4">
      <div className="velo-ie" aria-hidden="true" />
      <div className="panel-admin relative w-full max-w-md rounded-2xl p-7 text-center">
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
        <p className="mt-3 text-xs leading-relaxed text-perla-400">
          Para darle acceso, en Supabase agrega ese correo en la tabla{' '}
          <code className="text-oro-400">administradores</code> y vuelve a entrar.
        </p>

        {cambiando ? (
          <p className="mt-4 text-sm text-perla-300">Cambiando de cuenta…</p>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setCambiando(true)
                void salir()
              }}
              className="boton-oro w-full rounded-xl py-3"
            >
              Entrar con otra cuenta
            </button>
            <button
              type="button"
              onClick={() => void salir()}
              className="rounded border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-perla-200 transition hover:border-oro-500/60 hover:text-oro-400"
            >
              Salir de la sesión
            </button>
          </div>
        )}
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
    <div className="panel-admin-fuerte rounded-xl p-5">
      <p className="rotulo">{rotulo}</p>
      <p className="font-display mt-2 text-4xl font-semibold" style={{ color: acento }}>
        {valor}
      </p>
      <p className="mt-1 text-xs text-perla-400">{detalle}</p>
    </div>
  )
}