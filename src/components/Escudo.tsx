import logo from '../assets/logo/logo.png'

export function Escudo({ alto = 'h-20' }: { alto?: string }) {
  return (
    <span
      className={`relative inline-flex ${alto} items-center justify-center rounded-full border border-oro-500/45 bg-perla-50 p-2.5 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.95)]`}
    >
      <img
        src={logo}
        alt="Escudo de la I.E Jimenez Pimentel"
        className="h-full w-full object-contain"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-ink-950/15"
      />
    </span>
  )
}

export function Ornamento() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-oro-500/50" />
      <svg className="h-2.5 w-2.5 text-oro-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.6 6.9L21.5 12l-6.9 2.6L12 21.5l-2.6-6.9L2.5 12l6.9-3.1L12 2z" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-oro-500/50" />
    </div>
  )
}