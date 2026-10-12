import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextValue = {
  sesion: Session | null
  cargando: boolean
  correo: string
  recienConfirmada: boolean
  salir: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return valor
}