import { LoaderCircle, Mail } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { MagicLinkSent } from '../components/MagicLinkSent'
import { buttonPrimary, inputClass } from '../components/ui'
import { AuthLayout } from '../layouts/AuthLayout'
import { authErrorMessage, sendMagicLink } from '../lib/magicLink'
import { roleHome } from '../lib/users'

export function Login() {
  const { user, profile, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Si ya tiene sesión, lo llevamos directo a su panel.
  if (!loading && user) {
    return <Navigate to={profile ? roleHome[profile.rol] : '/completar-perfil'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await sendMagicLink(email)
      setSentTo(email.trim().toLowerCase())
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
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={sending} className={`${buttonPrimary} w-full py-3`}>
          {sending && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {sending ? 'Enviando…' : 'Enviar enlace de acceso'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-brand-700 hover:text-brand-800">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  )
}
