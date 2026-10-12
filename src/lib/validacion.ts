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