import { Link } from 'react-router'

type LogoProps = {
  /** "light" para fondos oscuros, "dark" para fondos claros */
  tone?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  to?: string
}

const sizes = {
  sm: { box: 'size-8 rounded-lg', text: 'text-lg' },
  md: { box: 'size-10 rounded-xl', text: 'text-xl' },
  lg: { box: 'size-14 rounded-2xl', text: 'text-3xl' },
}

export function LogoMark({ className = 'size-10 rounded-xl' }: { className?: string }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center bg-brand-800 shadow-sm ${className}`}>
      <svg viewBox="0 0 64 64" className="size-[70%]" aria-hidden="true">
        <path
          d="M46 14c-15 0-26 8-26 21 0 3 1 6 2 8 2-9 8-15 18-19-8 5-13 11-15 20 2 1 4 1 7 1 13 0 18-12 14-31Z"
          fill="#b8e986"
        />
      </svg>
    </span>
  )
}

export function Logo({ tone = 'dark', size = 'md', to = '/' }: LogoProps) {
  const s = sizes[size]
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="EcoPuntos, ir al inicio">
      <LogoMark className={s.box} />
      <span className={`font-extrabold tracking-tight ${s.text}`}>
        <span className={tone === 'light' ? 'text-white' : 'text-brand-900'}>Eco</span>
        <span className={tone === 'light' ? 'text-lime-accent' : 'text-brand-500'}>Puntos</span>
      </span>
    </Link>
  )
}
