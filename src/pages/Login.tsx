import { LoaderCircle, Mail, MailCheck } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/context'
import { PasswordInput } from '../components/PasswordInput'
import { buttonPrimary, buttonSecondary, inputClass } from '../components/ui'
import { AuthLayout } from '../layouts/AuthLayout'
import { authErrorMessage } from '../lib/magicLink'
import { resetPassword, signInWithPassword } from '../lib/passwordAuth'
import { roleHome } from '../lib/users'

const label = 'mb-1.5 block text-sm font-medium text-slate-700'

/** Pantalla para pedir el correo de "olvidé mi contraseña". */
function ForgotPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <MailCheck className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Revisa tu correo</h1>
        <p className="mt-3 text-slate-600">
          Si existe una cuenta con <span className="font-semibold text-slate-900">{email.trim().toLowerCase()}</span>, te llegará un
          enlace para crear una contraseña nueva.
        </p>
        <ul className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
          <li>• Puede tardar uno o dos minutos. Revisa también la carpeta de spam.</li>
          <li>• Si tu navegador muestra una advertencia al abrir el enlace, cópialo y ábrelo en otro navegador (por ejemplo, Microsoft Edge).</li>
        </ul>
        <button type="button" onClick={onBack} className={`${buttonSecondary} mt-6`}>
          Volver a iniciar sesión
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recuperar contraseña</h1>
      <p className="mt-2 text-slate-500">Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="reset-email" className={label}>Correo electrónico</label>
          <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tucorreo@ejemplo.com" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={sending} className={`${buttonPrimary} w-full py-3`}>
          {sending && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          Enviar enlace
        </button>
      </form>
      <button type="button" onClick={onBack} className="mt-6 w-full text-center text-sm font-semibold text-brand-700 hover:text-brand-800">
        ← Volver a iniciar sesión
      </button>
    </>
  )
}

export function Login() {
  const { user, profile, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya tiene sesión, lo llevamos directo a su panel.
  if (!loading && user) {
    return <Navigate to={profile ? roleHome[profile.rol] : '/completar-perfil'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSigningIn(true)
    try {
      await signInWithPassword(email, password)
      // Al iniciar sesión, la app redirige sola al panel correspondiente.
    } catch (err) {
      setError(authErrorMessage(err))
      setSigningIn(false)
    }
  }

  return (
    <AuthLayout>
      {forgot ? (
        <ForgotPassword initialEmail={email} onBack={() => setForgot(false)} />
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inicia sesión</h1>
          <p className="mt-2 text-slate-500">Ingresa con tu correo y tu contraseña.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className={label}>Correo electrónico</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="email" type="email" required autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11`} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Contraseña</label>
                <button type="button" onClick={() => setForgot(true)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={signingIn} className={`${buttonPrimary} w-full py-3`}>
              {signingIn && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
              {signingIn ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-brand-700 hover:text-brand-800">
              Regístrate
            </Link>
          </p>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            ¿Te registraste antes con enlace por correo y no tienes contraseña? Usa "¿Olvidaste tu contraseña?" para crear una.
          </p>
        </>
      )}
    </AuthLayout>
  )
}
