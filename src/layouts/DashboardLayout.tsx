import type { LucideIcon } from 'lucide-react'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { signOut } from 'firebase/auth'
import { Link, NavLink } from 'react-router'
import { useAuth } from '../auth/context'
import { Logo, LogoMark } from '../components/Logo'
import { auth } from '../lib/firebase'
import { roleLabels } from '../lib/users'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

type Props = {
  roleLabel: string
  nav: NavItem[]
  children: ReactNode
}

function SideNav({ nav, roleLabel, onNavigate }: { nav: NavItem[]; roleLabel: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-brand-950 px-4 py-6">
      <div className="px-2">
        <Logo tone="light" size="sm" />
        <p className="mt-3 inline-block rounded-md bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200">
          {roleLabel}
        </p>
      </div>
      <nav className="mt-8 flex-1 space-y-1" aria-label="Menú del panel">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-700 text-white shadow-sm' : 'text-brand-100/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => void signOut(auth)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-100/80 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-5" aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  )
}

/** Estructura común de los paneles: menú lateral, barra superior y contenido. */
export function DashboardLayout({ roleLabel, nav, children }: Props) {
  const [open, setOpen] = useState(false)
  const { user, profile } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Menú lateral fijo en pantallas grandes */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SideNav nav={nav} roleLabel={roleLabel} />
      </aside>

      {/* Menú deslizable en celulares y tabletas */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85%]">
            <SideNav nav={nav} roleLabel={roleLabel} onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-1.5 text-brand-100 hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-6" />
          </button>
          <Link to="/" className="lg:hidden" aria-label="EcoPuntos, ir al inicio">
            <LogoMark className="size-8 rounded-lg" />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Notificaciones">
              <Bell className="size-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-800">
                {(profile?.nombre ?? user?.email ?? '?').trim().charAt(0)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{profile?.nombre ?? user?.email}</p>
                <p className="text-xs text-slate-500">{profile ? roleLabels[profile.rol] : roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
