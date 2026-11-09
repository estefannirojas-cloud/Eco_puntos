import { Link } from 'react-router'
import { LogoMark } from '../components/Logo'

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
      <LogoMark className="size-14 rounded-2xl" />
      <h1 className="mt-6 text-3xl font-bold text-brand-950">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">La dirección que buscas no existe o fue movida.</p>
      <Link to="/" className="mt-6 rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-800">
        Volver al inicio
      </Link>
    </main>
  )
}
