import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { PasswordInput } from '../components/PasswordInput'
import { buttonPrimary, inputClass } from '../components/ui'
import { AuthLayout } from '../layouts/AuthLayout'
import { authErrorMessage } from '../lib/magicLink'
import { MIN_PASSWORD_LENGTH, passwordProblem, registerWithPassword } from '../lib/passwordAuth'
import { roleHome } from '../lib/users'

const label = 'mb-1.5 block text-sm font-medium text-slate-700'

export function Register() {
  const { user, profile, loading } = useAuth()
  const [form, setForm] = useState({ nombre: '', correo: '', celular: '', ciudad: '', password: '', confirmacion: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mientras se crea la cuenta no redirigimos, para dar tiempo a guardar el perfil.
  if (!loading && user && !creating) {
    return <Navigate to={profile ? roleHome[profile.rol] : '/completar-perfil'} replace />
  }

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = passwordProblem(form.password, form.confirmacion)
    if (problem) return setError(problem)
    setError(null)
    setCreating(true)
    try {
      await registerWithPassword(form.correo, form.password, { nombre: form.nombre, celular: form.celular, ciudad: form.ciudad })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crea tu cuenta</h1>
      <p className="mt-2 text-slate-500">Únete a EcoPuntos y empieza a sumar con cada entrega.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className={label}>Nombre completo</label>
          <input id="name" required maxLength={100} autoComplete="name" placeholder="Ej.: María Gómez" value={form.nombre} onChange={(e) => update('nombre', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Correo electrónico</label>
          <input id="email" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" value={form.correo} onChange={(e) => update('correo', e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={label}>
              Celular <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input id="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="300 123 4567" value={form.celular} onChange={(e) => update('celular', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="city" className={label}>Ciudad o municipio</label>
            <input id="city" required maxLength={60} autoComplete="address-level2" placeholder="Ej.: Popayán" value={form.ciudad} onChange={(e) => update('ciudad', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="password" className={label}>Contraseña</label>
          <PasswordInput id="password" value={form.password} onChange={(v) => update('password', v)} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">Mínimo {MIN_PASSWORD_LENGTH} caracteres, con letras y números.</p>
        </div>
        <div>
          <label htmlFor="confirm" className={label}>Confirmar contraseña</label>
          <PasswordInput id="confirm" value={form.confirmacion} onChange={(v) => update('confirmacion', v)} autoComplete="new-password" />
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" required className="mt-0.5 size-4 rounded border-slate-300 accent-brand-700" />
          <span>Acepto los términos de uso y la política de tratamiento de datos personales.</span>
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={creating} className={`${buttonPrimary} w-full py-3`}>
          {creating && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {creating ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>
      </form>

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
