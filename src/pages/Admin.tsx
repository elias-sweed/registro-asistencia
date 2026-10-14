import { useCallback, useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Chart01Icon,
  Delete02Icon,
  Home01Icon,
  Logout01Icon,
  Refresh01Icon,
  Table01Icon,
} from '@hugeicons/core-free-icons'
import Dock from '../components/Dock'
import type { DockItemData } from '../components/Dock'
import { Esqueletos } from '../components/Esqueletos'
import SwipeRow from '../components/SwipeRow'
import { Escudo, Ornamento } from '../components/Escudo'
import { GraficoBarras, GraficoDona } from '../components/Graficos'
import type { Segmento } from '../components/Graficos'
import { ModalConfirmar } from '../components/ModalConfirmar'
import { ReporteImpresion } from '../components/ReporteImpresion'
import { useAuth } from '../context/authContext'
import { consultarPanel, eliminarCuenta, esAdministrador } from '../lib/admin'
import { textoPrograma, textoTurno } from '../lib/constantes'
import { claveDia, diasDesde, fechaConDia, fechaDetallada, hoyEnLima } from '../lib/fechas'
import { supabase } from '../lib/supabase'
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

/* El navbar con los mismos tonos del colegio: negro, oro y pergamino. */
const TEMA_DOCK = {
  '--dock-panel': 'rgba(12, 10, 7, 0.88)',
  '--dock-panel-edge': 'rgba(201, 162, 39, 0.35)',
  '--dock-panel-highlight': 'rgba(236, 217, 160, 0.1)',
  '--dock-panel-shadow': '0 18px 40px -18px rgba(0, 0, 0, 0.9), 0 4px 14px -6px rgba(0, 0, 0, 0.6)',
  '--dock-tile': 'linear-gradient(180deg, #241f16 0%, #16120c 100%)',
  '--dock-tile-edge': 'rgba(201, 162, 39, 0.22)',
  '--dock-tile-highlight': 'rgba(236, 217, 160, 0.12)',
  '--dock-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
  '--dock-tile-active': 'linear-gradient(180deg, #6b5620 0%, #3d2f12 100%)',
  '--dock-tile-active-edge': 'rgba(236, 217, 160, 0.55)',
  '--dock-ink': '#ece3d2',
  '--dock-label': '#16120c',
  '--dock-label-ink': '#f3ead6',
  '--dock-dot': '#c9a227',
  '--dock-separator': 'rgba(201, 162, 39, 0.3)',
  '--dock-press': 'brightness(0.8)',
  '--dock-menu': 'rgba(18, 15, 10, 0.92)',
  '--dock-menu-edge': 'rgba(201, 162, 39, 0.3)',
  '--dock-menu-ink': '#ece3d2',
  '--dock-menu-muted': 'rgba(236, 227, 210, 0.45)',
  '--dock-menu-separator': 'rgba(201, 162, 39, 0.22)',
  '--dock-menu-shadow': '0 18px 40px -14px rgba(0, 0, 0, 0.7), 0 3px 10px rgba(0, 0, 0, 0.35)',
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
  const [refrescando, setRefrescando] = useState(false)

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

  /** El botón Actualizar sube arriba y muestra el panel cargando. */
  const refrescar = useCallback(async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRefrescando(true)
    try {
      await cargar()
    } finally {
      setRefrescando(false)
    }
  }, [cargar])

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
      setError={setError}
      filtro={filtro}
      setFiltro={setFiltro}
      dia={dia}
      setDia={setDia}
      programaCiclo={programaCiclo}
      setProgramaCiclo={setProgramaCiclo}
      refrescando={refrescando}
      busqueda={busqueda}
      setBusqueda={setBusqueda}
      salir={salir}
      recargar={() => void refrescar()}
    />
  )
}

function Panel({
  datos,
  correo,
  error,
  setError,
  filtro,
  setFiltro,
  dia,
  setDia,
  programaCiclo,
  setProgramaCiclo,
  refrescando,
  busqueda,
  setBusqueda,
  salir,
  recargar,
}: {
  datos: AdminDatos
  correo: string
  error: string
  setError: (v: string) => void
  filtro: Filtro
  setFiltro: (v: Filtro) => void
  dia: FiltroDia
  setDia: (v: FiltroDia) => void
  programaCiclo: FiltroPrograma
  setProgramaCiclo: (v: FiltroPrograma) => void
  refrescando: boolean
  busqueda: string
  setBusqueda: (v: string) => void
  salir: () => Promise<void>
  recargar: () => void
}) {
  const [borrando, setBorrando] = useState<string | null>(null)
  const [borrandoNombre, setBorrandoNombre] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [pasoBorrado, setPasoBorrado] = useState<1 | 2>(1)
  const [seccion, setSeccion] = useState('resumen')

  /* La pista de "desliza para eliminar" solo sale la primera vez: cuando ya
     lo intentaste una vez, ya no hace falta explicarlo. */
  const [mostrarPista, setMostrarPista] = useState(
    () => localStorage.getItem('asistencia:pista-borrado') !== '1',
  )

  const ocultarPista = useCallback(() => {
    setMostrarPista(false)
    try {
      localStorage.setItem('asistencia:pista-borrado', '1')
    } catch {
      /* si no se puede guardar, la pista se oculta igual en esta sesion */
    }
  }, [])

  // El panel no se cuenta a si mismo: las cuentas de administrador se
  // quitan de la lista y de todas las cifras.
  const [correosAdmin, setCorreosAdmin] = useState<Set<string>>(new Set())

  useEffect(() => {
    let vivo = true
    void supabase
      .rpc('correos_administradores')
      .then(({ data }) => {
        if (!vivo || !Array.isArray(data)) return
        setCorreosAdmin(new Set(data.map((c) => c.toLowerCase())))
      })
    return () => {
      vivo = false
    }
  }, [])

  // Marca en el dock la sección que se está viendo.
  useEffect(() => {
    const ids = ['resumen', 'graficos', 'programas', 'practicantes']
    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setSeccion(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    for (const id of ids) {
      const elemento = document.getElementById(id)
      if (elemento) observador.observe(elemento)
    }
    return () => observador.disconnect()
  }, [])

  const { marcaron: marcaronCrudos, pendientes: pendientesCrudos } = datos

  const marcaron = useMemo(
    () => marcaronCrudos.filter((f) => !correosAdmin.has(f.correo.toLowerCase())),
    [marcaronCrudos, correosAdmin],
  )
  const pendientes = useMemo(
    () => pendientesCrudos.filter((f) => !correosAdmin.has(f.correo.toLowerCase())),
    [pendientesCrudos, correosAdmin],
  )

  // Cifras recalculadas sin las cuentas de administrador, para que los
  // indicadores cuadren con lo que se ve en la lista.
  const resumen = useMemo(() => {
    const cuentas = marcaron.length + pendientes.length
    return {
      cuentas,
      marcaron: marcaron.length,
      pendientes: cuentas - marcaron.length,
      hoy: marcaron.filter((f) => f.fecha && claveDia(f.fecha) === 'hoy').length,
    }
  }, [marcaron, pendientes])

  const por_programa = useMemo(() => {
    const mapa = new Map<string, { total: number; marcaron: number }>()
    for (const fila of [...marcaron, ...pendientes]) {
      const clave = fila.programa || 'SIN_DATO'
      const actual = mapa.get(clave) ?? { total: 0, marcaron: 0 }
      actual.total += 1
      if ('fecha' in fila && fila.fecha) actual.marcaron += 1
      mapa.set(clave, actual)
    }
    return [...mapa.entries()]
      .map(([programa, valor]) => ({ programa, ...valor }))
      .sort((a, b) => b.total - a.total)
  }, [marcaron, pendientes])

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

  const vacio =
    dia === 'todo'
      ? 'No hay practicantes que cumplan este filtro.'
      : 'Nadie registró asistencia ese día.'

  const marcadosVisibles = filas.filter((f) => f.estado === 'marcaron').length
  const pendientesVisibles = filas.length - marcadosVisibles

  /** "1 persona" / "14 personas",acentos y plural bien puestos. */
  const cuenta = (n: number, singular: string, plural: string) =>
    `${n} ${n === 1 ? singular : plural}`

  const resumenLista =
    filas.length === 0
      ? 'En esta vista no hay ninguna persona registrada.'
      : `En total hay ${cuenta(filas.length, 'persona registrada', 'personas registradas')}. ${cuenta(marcadosVisibles, 'ya registró', 'ya registraron')} su asistencia y ${cuenta(pendientesVisibles, 'todavía no la registra', 'todavía no la registran')}.`

  // El PDF imprime exactamente lo que se está viendo en pantalla.
  const tituloFiltro = [
    OPCIONES_DIA.find((o) => o.valor === dia)?.texto,
    filtro === 'marcaron'
      ? 'solo los que marcaron'
      : filtro === 'pendientes'
        ? 'solo los que no han marcado'
        : null,
    busqueda.trim() ? `con «${busqueda.trim()}» en el nombre o correo` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  function pedirBorrado(correo: string, nombre: string) {
    setBorrando(correo)
    setBorrandoNombre(nombre)
    setPasoBorrado(1)
  }

  /** Primera confirmación: solo avanza al aviso final. */
  function confirmarPasoUno() {
    setPasoBorrado(2)
  }

  function cancelarBorrado() {
    setBorrando(null)
    setBorrandoNombre('')
    setPasoBorrado(1)
  }

  async function confirmarBorrado() {
    if (!borrando) return
    setEliminando(true)
    try {
      await eliminarCuenta(borrando)
      cancelarBorrado()
      recargar()
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : 'No se pudo eliminar la cuenta. Inténtalo otra vez.',
      )
      cancelarBorrado()
    } finally {
      setEliminando(false)
    }
  }

  const scrollA = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itemsDock: DockItemData[] = [
    {
      icon: <HugeiconsIcon icon={Home01Icon} size={22} strokeWidth={1.8} />,
      label: 'Resumen',
      active: seccion === 'resumen',
      onClick: () => scrollA('resumen'),
    },
    {
      icon: <HugeiconsIcon icon={Chart01Icon} size={22} strokeWidth={1.8} />,
      label: 'Gráficos',
      active: seccion === 'graficos' || seccion === 'programas',
      onClick: () => scrollA('graficos'),
    },
    {
      icon: <HugeiconsIcon icon={Table01Icon} size={22} strokeWidth={1.8} />,
      label: 'Practicantes',
      active: seccion === 'practicantes',
      badge: pendientes.length > 0 ? pendientes.length : undefined,
      onClick: () => scrollA('practicantes'),
    },
    { separator: true },
    {
      icon: (
        <HugeiconsIcon
          icon={Refresh01Icon}
          size={22}
          strokeWidth={1.8}
          className={refrescando ? 'animate-spin' : ''}
        />
      ),
      label: 'Actualizar',
      active: refrescando,
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
        style={{ ...TEMA_DOCK, position: 'fixed' }}
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
          {refrescando && (
            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-oro-500/40 bg-oro-500/10 px-3 py-1.5 text-xs font-semibold text-oro-400">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-oro-400 border-t-transparent" />
              Actualizando…
            </span>
          )}
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-carmesi-400/40 bg-carmesi-500/10 px-3 py-2 text-sm text-perla-100">
            {error}
          </p>
        )}

        {refrescando ? (
          <Esqueletos />
        ) : (
          <>
            {/* Resumen */}
            <section
              id="resumen"
              className="grid scroll-mt-8 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
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
        </section>

        {/* Detalle por programa */}
        <section id="programas" className="panel-admin mt-6 rounded-xl p-6 scroll-mt-8">
          <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
            ¿Quién falta por marcar en cada programa?
          </h2>
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

        {/* Lista de practicantes */}
        <section id="practicantes" className="panel-admin mt-6 rounded-xl p-5 p-6 scroll-mt-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg leading-snug font-semibold text-perla-50">
                ¿Quién registró su asistencia y quién todavía no?
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-perla-400">
                {resumenLista}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo…"
                aria-label="Buscar practicante"
                className="campo w-full flex-1 sm:w-56 sm:flex-none"
              />
              <button
                type="button"
                onClick={() => window.print()}
                disabled={filas.length === 0}
                title="Guarda este listado como PDF"
                className="boton-oro inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v12M8 11l4 4 4-4" />
                  <path d="M5 17v3h14v-3" />
                </svg>
                <span className="hidden sm:inline">Guardar como PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
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

{/* Móvil: filas que se deslizan para eliminar */}
          <ul className="mt-4 space-y-2.5 lg:hidden">
            {filas.length === 0 && (
              <li className="py-8 text-center text-sm text-perla-400">{vacio}</li>
            )}
            {filas.map((f, indice) => {
              const esMarcado = f.estado === 'marcaron'
              const nombre = f.nombres || f.apellidos ? `${f.nombres} ${f.apellidos}` : 'Sin datos'
              return (
                <li key={f.correo} className="relative">
                  <SwipeRow
                    label={`${nombre} — desliza para eliminar`}
                    height={124}
                    actionWidth={88}
                    direction="left"
                    actionColor="#b32026"
                    drawerColor="#241a17"
                    rowColor="rgba(255,255,255,0.05)"
                    textColor="#ece3d2"
                    actions={[
                      {
                        id: 'eliminar',
                        label: 'Eliminar',
                        icon: <HugeiconsIcon icon={Delete02Icon} size={20} strokeWidth={2} />,
                      },
                    ]}
                    onAction={() => ocultarPista()}
                    onCommit={() => {
                      ocultarPista()
                      pedirBorrado(f.correo, nombre)
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate font-medium text-perla-50">
                          {nombre}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            esMarcado
                              ? 'bg-asistio-500/15 text-asistio-300'
                              : 'bg-carmesi-500/15 text-carmesi-400'
                          }`}
                        >
                          {esMarcado ? 'Asistió' : 'Sin marcar'}
                        </span>
                      </div>
                      <p className="truncate text-xs text-perla-300">
                        {textoPrograma(f.programa as never)}
                        {f.ciclo ? ` · Ciclo ${f.ciclo}` : ''}
                        {esMarcado ? ` · ${textoTurno(f.turno)}` : ''}
                      </p>
                      <p className="truncate text-[11px] text-perla-400">
                        Marcó:{' '}
                        <span className={esMarcado ? 'text-asistio-300' : ''}>
                          {esMarcado && f.fecha ? fechaConDia(f.fecha) : 'Aún no marca'}
                        </span>{' '}
                        · Creó {fechaDetallada(f.creado_en).dia}{' '}
                        {fechaDetallada(f.creado_en).hora}
                      </p>
                    </div>
                  </SwipeRow>

                  {indice === 0 && mostrarPista && (
                    <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-end gap-2 pr-3">
                      <span className="pista-boton rounded-full bg-carmesi-500/30 p-2 text-carmesi-300">
                        <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} />
                      </span>
                      <span className="rounded-full border border-carmesi-400/50 bg-carmesi-500/25 px-2.5 py-1 text-[11px] font-semibold text-carmesi-200">
                        Desliza a la izquierda
                      </span>
                      <span className="pista-deslizar" aria-hidden="true">
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
                      </span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Escritorio: tabla */}
          <div className="mt-4 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[860px] text-left text-sm">
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
                  <th className="rotulo px-2 py-2.5">
                    <span className="sr-only">Eliminar</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center text-perla-400">
                      {vacio}
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
                              ? 'bg-asistio-500/15 text-asistio-300'
                              : 'bg-carmesi-500/15 text-carmesi-400'
                          }`}
                        >
                          {esMarcado ? 'Asistió' : 'Sin marcar'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs whitespace-nowrap text-perla-300">
                        <span className="block">{fechaDetallada(f.creado_en).dia}</span>
                        <span className="block text-perla-400">
                          {fechaDetallada(f.creado_en).hora}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-3 text-xs whitespace-nowrap ${
                          esMarcado ? 'font-semibold text-asistio-300' : 'text-perla-400'
                        }`}
                      >
                        {esMarcado && f.fecha ? fechaConDia(f.fecha) : 'Aún no marca'}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            pedirBorrado(f.correo, `${f.nombres} ${f.apellidos}`.trim() || f.correo)
                          }
                          title={`Eliminar la cuenta de ${completo ? `${f.nombres} ${f.apellidos}` : f.correo}`}
                          aria-label={`Eliminar la cuenta de ${completo ? `${f.nombres} ${f.apellidos}` : f.correo}`}
                          className="rounded-lg border border-white/10 p-2 text-perla-400 transition hover:border-carmesi-400/60 hover:text-carmesi-400"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
            </>
          )}

        <ReporteImpresion filas={filas} tituloFiltro={tituloFiltro} />

        <ModalConfirmar
          visible={borrando !== null}
          titulo={pasoBorrado === 1 ? '¿Eliminar esta cuenta?' : 'Última confirmación'}
          descripcion={
            pasoBorrado === 1
              ? 'Se va a borrar la cuenta y también su registro de asistencia.'
              : 'Esta es la última oportunidad. Cuando confirmes, se borra todo y no habrá forma de recuperarlo.'
          }
          iconoPeligro={pasoBorrado === 2}
          detalle={
            borrando ? (
              <p>
                <span className="block">
                  Vas a eliminar la cuenta de{' '}
                  <strong className="text-perla-50">{borrandoNombre}</strong>
                </span>
                <span className="mt-1 block font-mono text-xs">{borrando}</span>
                {pasoBorrado === 2 && (
                  <span className="mt-3 block text-carmesi-300">
                    Se borra la cuenta, su ficha de practicante y su asistencia. Todo.
                  </span>
                )}
              </p>
            ) : null
          }
          textoConfirmar={pasoBorrado === 1 ? 'Continuar' : 'Sí, eliminar para siempre'}
          textoCancelar={pasoBorrado === 1 ? 'Cancelar' : 'Mejor no'}
          confirmando={eliminando}
          onConfirmar={pasoBorrado === 1 ? confirmarPasoUno : () => void confirmarBorrado()}
          onCancelar={cancelarBorrado}
        />
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
