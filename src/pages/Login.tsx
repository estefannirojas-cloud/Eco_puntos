import { Building2, LayoutDashboard, Mail, Sprout, Warehouse } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '../layouts/AuthLayout'
import { InfoAlert, buttonPrimary, inputClass } from '../components/ui'

const previews = [
  { to: '/cliente', label: 'Panel del cliente', icon: Sprout },
  { to: '/gestor', label: 'Panel del gestor de reciclaje', icon: Warehouse },
  { to: '/admin', label: 'Panel del administrador', icon: Building2 },
]

export function Login() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Aún no hay conexión con Firebase: solo mostramos el aviso.
    setSent(true)
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inicia sesión</h1>
      <p className="mt-2 text-slate-500">
        Escribe tu correo y te enviaremos un enlace de acceso. No necesitas contraseña.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="email" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" className={`${inputClass} pl-11`} />
          </div>
        </div>
        <button type="submit" className={`${buttonPrimary} w-full py-3`}>
          Enviar enlace de acceso
        </button>
      </form>

      {sent && (
        <div className="mt-5">
          <InfoAlert title="El inicio de sesión aún no está activo">
            El envío del enlace por correo se activará en la próxima etapa, cuando conectemos
            Firebase. Por ahora no se envió ningún correo.
          </InfoAlert>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-brand-700 hover:text-brand-800">
          Regístrate
        </Link>
      </p>

      <div className="mt-10 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <LayoutDashboard className="size-4" aria-hidden="true" />
          Vista previa del diseño
        </p>
        <p className="mt-1 text-sm text-amber-800">
          Acceso temporal para revisar los paneles mientras no exista el inicio de sesión. Se
          quitará cuando conectemos Firebase.
        </p>
        <div className="mt-4 grid gap-2">
          {previews.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-amber-200 hover:ring-amber-400"
            >
              <p.icon className="size-4 text-brand-600" aria-hidden="true" />
              {p.label}
            </Link>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
