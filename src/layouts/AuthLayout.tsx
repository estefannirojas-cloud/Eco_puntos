import { CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '../components/Logo'
import { CURRENT_YEAR } from '../lib/constants'

/** Diseño de pantalla dividida para iniciar sesión y registrarse. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[32rem] rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
        <Logo tone="light" />
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Reciclar tiene valor,
            <br />
            <span className="text-lime-accent">transformar tiene futuro.</span>
          </h2>
          <ul className="mt-8 space-y-4 text-brand-100">
            {[
              'Acumula puntos por cada kilo que entregas',
              'Consulta tu historial y tu impacto ambiental',
              'Canjea tus puntos por recompensas',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CircleCheck className="size-5 shrink-0 text-lime-accent" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200/70">© {CURRENT_YEAR} EcoPuntos</p>
      </aside>

      <main className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-4 py-5 sm:px-8">
          <div className="lg:invisible">
            <Logo size="sm" />
          </div>
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-brand-700">
            ← Volver al inicio
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  )
}
