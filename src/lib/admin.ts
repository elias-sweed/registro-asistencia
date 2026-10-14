import { supabase } from './supabase'
import type { AdminDatos } from './types'

/** Indica si el correo actual tiene acceso al panel de administrador. */
export async function esAdministrador(correo: string): Promise<boolean> {
  if (!correo) return false

  const { data, error } = await supabase.rpc('es_admin')
  if (error || typeof data !== 'boolean') return false
  return data
}

/** Descarga todos los datos del panel. Lanza si el usuario no es administrador. */
export async function consultarPanel(): Promise<AdminDatos> {
  const { data, error } = await supabase.rpc('admin_datos')
  if (error) throw error
  return data
}

/**
 * Elimina una cuenta y, en cascada, su registro de asistencia.
 * Solo puede hacerlo un administrador.
 */
export async function eliminarCuenta(correo: string): Promise<void> {
  const { data, error } = await supabase.rpc('eliminar_cuenta', {
    p_correo: correo.trim().toLowerCase(),
  })
  if (error) {
    const mensaje = error.message ?? ''
    if (/NO_ADMIN/i.test(mensaje))
      throw new Error('Tu cuenta no tiene permiso para eliminar cuentas.')
    if (/NO_EXISTE/i.test(mensaje))
      throw new Error('Esa cuenta ya no existe.')
    throw new Error(`No se pudo eliminar la cuenta: ${mensaje}`)
  }
  if (data !== true) throw new Error('No se pudo eliminar la cuenta.')
}