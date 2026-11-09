import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { AuthLayout } from '../layouts/AuthLayout'
import { InfoAlert, buttonPrimary, inputClass } from '../components/ui'

export function Register() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Aún no hay conexión con Firebase: solo mostramos el aviso.
    setSent(true)
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crea tu cuenta</h1>
      <p className="mt-2 text-slate-500">Únete a EcoPuntos y empieza a sumar con cada entrega.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre completo
          </label>
          <input id="name" required autoComplete="name" placeholder="Ej.: María Gómez" className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input id="email" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" className={inputClass} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Celular <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input id="phone" type="tel" autoComplete="tel" placeholder="300 123 4567" className={inputClass} />
          </div>
          <div>
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">
              Ciudad o municipio
            </label>
            <input id="city" required autoComplete="address-level2" placeholder="Ej.: Popayán" className={inputClass} />
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" required className="mt-0.5 size-4 rounded border-slate-300 accent-brand-700" />
          <span>Acepto los términos de uso y la política de tratamiento de datos personales.</span>
        </label>
        <button type="submit" className={`${buttonPrimary} w-full py-3`}>
          Crear cuenta
        </button>
      </form>

      {sent && (
        <div className="mt-5">
          <InfoAlert title="El registro aún no está activo">
            La creación de cuentas se activará en la próxima etapa, cuando conectemos Firebase. Por
            ahora no se guardó ningún dato.
          </InfoAlert>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/ingresar" className="font-semibold text-brand-700 hover:text-brand-800">
          Inicia sesión
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-slate-400">
        Las cuentas de gestores y administradores las asigna el equipo de EcoPuntos.
      </p>
    </AuthLayout>
  )
}
