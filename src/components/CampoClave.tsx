import { useState } from 'react'

export function CampoClave({
  id,
  valor,
  alCambiar,
  autoComplete,
  placeholder,
  error,
}: {
  id: string
  valor: string
  alCambiar: (valor: string) => void
  autoComplete: string
  placeholder?: string
  error?: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        required
        minLength={6}
        autoComplete={autoComplete}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={placeholder}
        className={`campo pr-11 ${error ? 'campo-error' : ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-2 text-perla-300 transition hover:text-oro-400 focus:text-oro-400 focus:outline-none"
      >
        {visible ? (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path d="M10.6 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.7 3.2-3.9 5.1M6.3 6.8C4 8.3 2.4 10.5 2 12c1 2.5 5 7 10 7 1.6 0 3-.4 4.3-1.1" strokeLinecap="round" />
            <path d="M9.9 9.9a3 3 0 004.2 4.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}