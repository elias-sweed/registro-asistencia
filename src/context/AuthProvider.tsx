import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { leerCuentaPendiente } from '../lib/cuentaPendiente'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [recienConfirmada, setRecienConfirmada] = useState(false)

  /** Detecta que esta sesión viene de confirmar el correo de una cuenta recién creada. */
  const revisarConfirmacion = useCallback((nueva: Session | null) => {
    if (!nueva?.user.email) return
    const pendiente = leerCuentaPendiente()
    if (!pendiente) return
    if (pendiente.email.toLowerCase() === nueva.user.email.toLowerCase()) {
      setRecienConfirmada(true)
    }
  }, [])

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return
      setSesion(data.session)
      revisarConfirmacion(data.session)
      setCargando(false)
    })

    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva)
      revisarConfirmacion(nueva)
      setCargando(false)
    })

    return () => {
      activo = false
      escucha.subscription.unsubscribe()
    }
  }, [revisarConfirmacion])

  const valor = useMemo<AuthContextValue>(
    () => ({
      sesion,
      cargando,
      correo: sesion?.user.email ?? '',
      recienConfirmada,
      salir: async () => {
        await supabase.auth.signOut()
      },
    }),
    [sesion, cargando, recienConfirmada],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}