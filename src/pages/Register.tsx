import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { MagicLinkSent } from '../components/MagicLinkSent'
import { buttonPrimary, inputClass } from '../components/ui'
import { AuthLayout } from '../layouts/AuthLayout'
import { authErrorMessage, sendMagicLink } from '../lib/magicLink'
import { roleHome } from '../lib/users'

export function Register() {
  const { user, profile, loading } = useAuth()
  const [form, setForm] = useState({ nombre: '', correo: '', celular: '', ciudad: '' })
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) {
    return <Navigate to={profile ? roleHome[profile.rol] : '/completar-perfil'} replace />
  }

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      // Los datos se guardan en Firestore cuando la persona abre el enlace del correo.
      await sendMagicLink(form.correo, { nombre: form.nombre, celular: form.celular, ciudad: form.ciudad })
      setSentTo(form.correo.trim().toLowerCase())
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <MagicLinkSent email={sentTo} onReset={() => setSentTo(null)} />
      </AuthLayout>
    )
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
          <input id="name" required maxLength={100} autoComplete="name" placeholder="Ej.: María Gómez" value={form.nombre} onChange={(e) => update('nombre', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input id="email" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" value={form.correo} onChange={(e) => update('correo', e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Celular <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input id="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="300 123 4567" value={form.celular} onChange={(e) => update('celular', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">
              Ciudad o municipio
            </label>
            <input id="city" required maxLength={60} autoComplete="address-level2" placeholder="Ej.: Popayán" value={form.ciudad} onChange={(e) => update('ciudad', e.target.value)} className={inputClass} />
          </div>
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
        <button type="submit" disabled={sending} className={`${buttonPrimary} w-full py-3`}>
          {sending && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {sending ? 'Enviando…' : 'Crear cuenta'}
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
