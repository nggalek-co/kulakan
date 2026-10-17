import { Link } from '@tanstack/react-router'
import { ShoppingBasket } from 'lucide-react'

interface KulakanMarkProps {
  className?: string
  iconClassName?: string
  idPrefix?: string
}

/**
 * Kulakan Brandmark Icon using Lucide ShoppingBasket
 */
export function KulakanMark({
  className = 'size-9',
  iconClassName = 'size-5',
}: KulakanMarkProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs dark:bg-emerald-600 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <ShoppingBasket className={iconClassName} />
    </div>
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
  const markSizeClasses = {
    sm: { box: 'size-8 rounded-lg', icon: 'size-4' },
    md: { box: 'size-9 rounded-xl', icon: 'size-5' },
    lg: { box: 'size-11 rounded-xl', icon: 'size-6' },
  }

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const currentSize = markSizeClasses[size]

  return (
    <Link
      to="/"
      search={{}}
      onClick={onClick}
      className={`group flex items-center gap-3 select-none rounded-xl p-1 -m-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 active:scale-[0.98] cursor-pointer ${className}`}
      aria-label="Kulakan Trenggalek - Beranda"
    >
      {/* Brandmark Icon with subtle interactive hover lift */}
      <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105">
        <KulakanMark
          className={currentSize.box}
          iconClassName={currentSize.icon}
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${titleSizes[size]} font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400`}
          >
            Kulakan
          </span>

          {showBadge && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
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
