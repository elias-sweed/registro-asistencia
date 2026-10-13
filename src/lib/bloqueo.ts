/** Bloqueo por navegador: una vez registrada la asistencia en ESTE navegador,
 *  no se puede volver a registrar con la misma cuenta. Si otra persona entra
 *  después en el mismo navegador, NO se bloquea: solo compara el correo. */
const CLAVE = 'asistencia:registrado'

export function marcarRegistroHecho(correo: string) {
  try {
    localStorage.setItem(CLAVE, correo)
  } catch {
    return
  }
}

/** Devuelve el correo guardado solo si coincide con la sesión actual. */
export function navegadorRegistrado(correo: string | null): string | null {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado && guardado === correo) return guardado
    return null
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