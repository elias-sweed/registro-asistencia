/** IP publica del dispositivo. Devuelve null si no se puede obtener. */
export async function obtenerIpPublica(): Promise<string | null> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null

  const control = new AbortController()
  const limite = window.setTimeout(() => control.abort(), 4000)

  try {
    const respuesta = await fetch('https://api.ipify.org?format=json', {
      signal: control.signal,
    })
    if (!respuesta.ok) return null
    const datos = (await respuesta.json()) as { ip?: string }
    return datos.ip?.trim() || null
  } catch {
    return null
  } finally {
    window.clearTimeout(limite)
  }
}