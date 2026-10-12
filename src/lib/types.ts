export type Programa = 'SENATI' | 'UCV' | 'DOCENTE_API'
export type Turno = 'MANANA' | 'TARDE'

export type FilaResumen = {
  correo: string
  nombres: string
  apellidos: string
  programa: Programa | 'SIN_DATO'
  ciclo: number | null
}

export type FilaMarcado = FilaResumen & {
  turno: Turno
  fecha: string
}

export type FilaPendiente = FilaResumen & {
  creado_en: string
}

export type AdminDatos = {
  resumen: {
    cuentas: number
    marcaron: number
    pendientes: number
    hoy: number
    sin_programa: number
  }
  por_programa: { programa: string; total: number; marcaron: number }[]
  por_ciclo: { ciclo: number; total: number; marcaron: number }[]
  por_dia: { dia: string; total: number }[]
  marcaron: FilaMarcado[]
  pendientes: FilaPendiente[]
}

export type Practicante = {
  id: string
  correo: string
  nombres: string | null
  apellidos: string | null
  programa: Programa | null
  ciclo: number | null
  turno: Turno | null
  creado_en: string
  actualizado_en: string
}

export type Asistencia = {
  id: string
  practicante_id: string
  correo: string
  nombres: string
  apellidos: string
  programa: Programa
  ciclo: number | null
  turno: Turno
  asistio: boolean
  fecha: string
  creado_en: string
}

export type Database = {
  public: {
    Tables: {
      practicantes: {
        Row: Practicante
        Insert: Omit<Practicante, 'nombres' | 'apellidos' | 'ciclo' | 'turno' | 'creado_en' | 'actualizado_en'> &
          Partial<Practicante>
        Update: Partial<Practicante>
        Relationships: []
      }
      asistencias: {
        Row: Asistencia
        Insert: Omit<Asistencia, 'id' | 'creado_en' | 'fecha'> & Partial<Asistencia>
        Update: Partial<Asistencia>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      es_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      admin_datos: {
        Args: Record<PropertyKey, never>
        Returns: AdminDatos
      }
      registrar_asistencia: {
        Args: {
          p_nombres: string
          p_apellidos: string
          p_programa: Programa
          p_ciclo: number | null
          p_fecha?: string
          p_ip?: string | null
        }
        Returns: string
      }
    }
  }
}