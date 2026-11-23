export function Escudo({ alto = 'h-20' }: { alto?: string }) {
  return (
    <span
      className={`relative inline-flex ${alto} items-center justify-center rounded-full border border-oro-500/60 bg-gradient-to-b from-perla-50/90 to-perla-100/80 p-2.5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85)]`}
    >
      {/* Escudo vectorial premium (I.E. Jimenez Pimentel - Tarapoto) */}
      <svg
        className="h-full w-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="escudoOro" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e7a8" />
            <stop offset="50%" stopColor="#c9a227" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
          <linearGradient id="escudoAzul" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="brillo">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Fondo del escudo */}
        <path
          d="M60 4 C30 4 10 24 10 44c0 30 50 76 50 76s50-46 50-76c0-20-20-40-50-40"
          fill="url(#escudoAzul)"
          stroke="url(#escudoOro)"
          strokeWidth="4"
        />

        {/* Banda superior dividida */}
        <path
          d="M60 4 C30 4 10 24 10 44 L60 40 L60 4 Z"
          fill="#dc2626"
        />
        <path
          d="M60 4 L60 40 L110 44 C110 24 90 4 60 4 Z"
          fill="#dc2626"
        />
        <rect x="30" y="10" width="60" height="20" fill="#ffffff" />

        {/* Letras I y E */}
        <text
          x="22"
          y="32"
          fontFamily="Georgia, serif"
          fontSize="26"
          fontWeight="900"
          fill="#ffffff"
          letterSpacing="2"
        >
          I
        </text>
        <text
          x="94"
          y="32"
          fontFamily="Georgia, serif"
          fontSize="26"
          fontWeight="900"
          fill="#ffffff"
          letterSpacing="2"
        >
          E
        </text>

        {/* JP central grande */}
        <text
          x="60"
          y="74"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="42"
          fontWeight="900"
          fill="url(#escudoOro)"
          textAnchor="middle"
          letterSpacing="-4"
          filter="url(#brillo)"
        >
          JP
        </text>

        {/* Texto SUPERACION */}
        <text
          x="60"
          y="54"
          fontFamily="Georgia, serif"
          fontSize="10"
          fontWeight="700"
          fill="#f3e7a8"
          textAnchor="middle"
          letterSpacing="2"
        >
          SUPERACION
        </text>

        {/* Texto ESTUDIO y TRABAJO laterales */}
        <text
          x="14"
          y="66"
          fontFamily="Georgia, serif"
          fontSize="10"
          fontWeight="700"
          fill="#f3e7a8"
          transform="rotate(-60 14 66)"
        >
          ESTUDIO
        </text>
        <text
          x="106"
          y="66"
          fontFamily="Georgia, serif"
          fontSize="10"
          fontWeight="700"
          fill="#f3e7a8"
          transform="rotate(60 106 66)"
        >
          TRABAJO
        </text>

        {/* Texto TARAPOTO inferior */}
        <text
          x="60"
          y="100"
          fontFamily="Georgia, serif"
          fontSize="11"
          fontWeight="700"
          fill="#f3e7a8"
          textAnchor="middle"
          letterSpacing="1"
        >
          TARAPOTO
        </text>
      </svg>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-ink-950/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-oro-500/20 via-transparent to-transparent"
      />
    </span>
  );
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
  );
}
