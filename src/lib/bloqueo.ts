/** Bloqueo por navegador: una vez registrada la asistencia en ESTE navegador,
 *  no se puede volver a registrar con la misma cuenta. */
const CLAVE = 'asistencia:registrado'

export function marcarRegistroHecho(correo: string) {
  try {
    localStorage.setItem(CLAVE, correo)
  } catch {
    return
  }
}

export function navegadorRegistrado(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function limpiarRegistro() {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    return
  }
}