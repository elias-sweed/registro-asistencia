const CLAVE = 'asistencia:cuenta-pendiente'
const MINUTOS_VIGENCIA = 30

export type CuentaPendiente = {
  email: string
  clave: string
  creado: number
}

/** Guarda correo y contraseña mientras el usuario confirma su cuenta por email. */
export function guardarCuentaPendiente(email: string, clave: string) {
  const datos: CuentaPendiente = { email, clave, creado: Date.now() }
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    return
  }
}

export function leerCuentaPendiente(): CuentaPendiente | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null

    const datos = JSON.parse(crudo) as CuentaPendiente
    const vigente = Date.now() - datos.creado < MINUTOS_VIGENCIA * 60_000

    if (!vigente) {
      borrarCuentaPendiente()
      return null
    }
    return datos
  } catch {
    return null
  }
}

export function borrarCuentaPendiente() {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    return
  }
}