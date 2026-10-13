/** Letras, espacios, apóstrofos, guiones y puntos. Sin números ni símbolos. */
const RE_NOMBRE = /^[\p{L}][\p{L}\s'’-]{1,59}$/u

export function validarNombre(valor: string): string | null {
  const texto = valor.trim().replace(/\s+/g, ' ')

  if (!texto) return 'Este campo es obligatorio.'
  if (texto.length < 2) return 'Debe tener al menos 2 letras.'
  if (texto.length > 60) return 'No puede superar los 60 caracteres.'
  if (!RE_NOMBRE.test(texto))
    return 'Solo se permiten letras, espacios, apóstrofos, guiones y puntos.'

  return null
}

/** Deja escribir solo lo permitido mientras se teclea. */
export function limpiarNombre(valor: string) {
  return valor.replace(/[^\p{L}\s'’-]/gu, '')
}

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/** Genera el correo interno que usa Supabase a partir del nombre y apellido. */
export function correoDesdeNombre(nombre: string, apellidos: string) {
  const parte = `${nombre} ${apellidos}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${parte || 'practicante'}@asistencia.local`
}

export function validarCorreo(valor: string): string | null {
  const texto = valor.trim()

  if (!texto) return 'El correo electrónico es obligatorio.'
  if (texto.length > 254) return 'El correo es demasiado largo.'
  if (!RE_CORREO.test(texto)) return 'Ingresa un correo electrónico válido.'

  return null
}

export function validarClave(valor: string): string | null {
  if (!valor) return 'La contraseña es obligatoria.'
  if (valor.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (valor.length > 72) return 'La contraseña no puede superar los 72 caracteres.'

  return null
}

/** Genera una contraseña segura de 12 caracteres con letras, números y símbolos. */
export function generarClaveSegura(longitud = 12): string {
  const minusculas = 'abcdefghijkmnpqrstuvwxyz'
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numeros = '23456789'
  const simbolos = '!@#$%&*+-=?'
  const todos = minusculas + mayusculas + numeros + simbolos

  const valores = new Uint32Array(longitud)
  crypto.getRandomValues(valores)

  const obligatorias = [
    minusculas[valores[0] % minusculas.length],
    mayusculas[valores[1] % mayusculas.length],
    numeros[valores[2] % numeros.length],
    simbolos[valores[3] % simbolos.length],
  ]

  const resto: string[] = []
  for (let i = obligatorias.length; i < longitud; i++) {
    resto.push(todos[valores[i] % todos.length])
  }

  const combinado = [...obligatorias, ...resto]
  for (let i = combinado.length - 1; i > 0; i--) {
    const j = valores[i] % (i + 1)
    ;[combinado[i], combinado[j]] = [combinado[j], combinado[i]]
  }

  return combinado.join('')
}