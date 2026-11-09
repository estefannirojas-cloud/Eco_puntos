import { Link } from 'react-router'
import { CURRENT_YEAR } from '../lib/constants'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200/80">
            Reciclar tiene valor, transformar tiene futuro. Un programa que convierte tus residuos
            aprovechables en puntos y recompensas, impulsando la economía circular.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Programa</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/#como-funciona" className="hover:text-white">Cómo funciona</Link></li>
            <li><Link to="/#beneficios" className="hover:text-white">Beneficios</Link></li>
            <li><Link to="/#impacto" className="hover:text-white">Impacto</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Cuenta</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/ingresar" className="hover:text-white">Iniciar sesión</Link></li>
            <li><Link to="/registro" className="hover:text-white">Crear cuenta</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-brand-200/60 sm:px-6 lg:px-8">
          © {CURRENT_YEAR} EcoPuntos. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
