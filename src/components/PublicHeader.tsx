import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Logo } from './Logo'

const links = [
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/#beneficios', label: 'Beneficios' },
  { href: '/#impacto', label: 'Impacto' },
  { href: '/#participantes', label: 'Participantes' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Secciones">
          {links.map((l) => (
            <Link key={l.href} to={l.href} className="text-sm font-medium text-slate-600 hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/ingresar" className="rounded-lg px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Registrarse
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col" aria-label="Secciones">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link to="/ingresar" className="rounded-lg border border-slate-300 px-4 py-2.5 text-center font-semibold text-brand-800">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="rounded-lg bg-brand-700 px-4 py-2.5 text-center font-semibold text-white">
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
