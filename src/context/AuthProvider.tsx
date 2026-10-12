import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return
      setSesion(data.session)
      setCargando(false)
    })

    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva)
      setCargando(false)
    })

    return () => {
      activo = false
      escucha.subscription.unsubscribe()
    }
  }, [])

  const valor = useMemo<AuthContextValue>(
    () => ({
      sesion,
      cargando,
      correo: sesion?.user.email ?? '',
      salir: async () => {
        await supabase.auth.signOut()
      },
    }),
    [sesion, cargando],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}