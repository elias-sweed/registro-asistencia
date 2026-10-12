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