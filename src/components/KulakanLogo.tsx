import { Link } from '@tanstack/react-router'

interface KulakanMarkProps {
  className?: string
  idPrefix?: string
}

/**
 * Kulakan Brandmark Vector Icon
 * A stylized market shopping basket + monogram 'K' + fresh agricultural leaf sprout.
 */
export function KulakanMark({ className = 'size-10', idPrefix = 'klk' }: KulakanMarkProps) {
  const bgGradId = `${idPrefix}-bg-grad`
  const goldGradId = `${idPrefix}-gold-grad`
  const leafGradId = `${idPrefix}-leaf-grad`
  const shadowId = `${idPrefix}-drop-shadow`

  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Lush Trenggalek Emerald Gradient */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* Golden Harvest Rattan Handle */}
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Fresh Agricultural Produce Sprout */}
        <linearGradient id={leafGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        {/* Subtle drop shadow for crisp white geometry */}
        <filter id={shadowId} x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#022c22" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Squircle Badge Base */}
      <rect width="44" height="44" rx="11" fill={`url(#${bgGradId})`} />
      <rect
        x="0.75"
        y="0.75"
        width="42.5"
        height="42.5"
        rx="10.25"
        fill="none"
        stroke="rgba(255, 255, 255, 0.22)"
        strokeWidth="1"
      />

      {/* Market Basket / Shopping Tote Handle (Top Arch) */}
      <path
        d="M 16 14.5 C 16 9.8 28 9.8 28 14.5"
        fill="none"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
      />

      {/* Fresh Agricultural Commodity Sprout (Trenggalek Produce) */}
      <path
        d="M 27.5 13.5 C 28 9.5 32.5 8 34 10.2 C 34 13.2 30.5 15 27.5 13.5 Z"
        fill={`url(#${leafGradId})`}
      />
      <path
        d="M 28 13.2 Q 30.8 11.8 33 10.2"
        stroke="#15803d"
        strokeWidth="0.75"
        strokeLinecap="round"
      />

      {/* Modern 'K' Monogram */}
      <g filter={`url(#${shadowId})`}>
        {/* Left vertical pillar */}
        <rect x="12" y="14.5" width="4.25" height="17" rx="2.125" fill="#ffffff" />

        {/* Upper diagonal arm (market upward trend / produce fold) */}
        <path
          d="M 16.5 23 L 26.5 14.8 C 27.4 14.1 28.6 14.6 28.9 15.6 C 29.2 16.4 28.8 17.3 28 17.9 L 19.8 24.5 Z"
          fill="#ffffff"
        />

        {/* Lower diagonal arm (market base / stability) */}
        <path
          d="M 17.8 22.8 L 27.2 30.5 C 28 31.2 28.1 32.4 27.4 33.1 C 26.7 33.8 25.5 33.7 24.7 33.1 L 16.5 26.2 Z"
          fill="#ffffff"
        />

        {/* Center Golden Accent Node */}
        <circle cx="18.2" cy="23.6" r="1.5" fill={`url(#${goldGradId})`} />
      </g>
    </svg>
  )
}

interface KulakanLogoProps {
  className?: string
  showBadge?: boolean
  showDomain?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

/**
 * Clickable Kulakan Logo Header / Navigation Component
 * Clicking returns the user to the home page with default reset filters.
 */
export function KulakanLogo({
  className = '',
  showBadge = true,
  showDomain = true,
  size = 'md',
  onClick,
}: KulakanLogoProps) {
  const markSizes = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
  }

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <Link
      to="/"
      search={{}}
      onClick={onClick}
      className={`group flex items-center gap-3 select-none rounded-xl p-1 -m-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 active:scale-[0.98] cursor-pointer ${className}`}
      aria-label="Kulakan Trenggalek - Beranda"
    >
      {/* Brandmark Icon with subtle interactive hover lift */}
      <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-1deg]">
        <KulakanMark className={markSizes[size]} />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${titleSizes[size]} font-black tracking-tight text-foreground transition-colors duration-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400`}
          >
            Kulakan
          </span>

          {showBadge && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors group-hover:bg-emerald-200/80 dark:group-hover:bg-emerald-900/60">
              Trenggalek
            </span>
          )}
        </div>

        {showDomain && (
          <p className="text-xs text-muted-foreground font-mono transition-colors group-hover:text-foreground/80">
            kulakan.nggalek.co
          </p>
        )}
      </div>
    </Link>
  )
}
