import { doc, getDoc } from 'firebase/firestore'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { buttonPrimary, inputClass } from '../components/ui'
import { AuthLayout } from '../layouts/AuthLayout'
import { db } from '../lib/firebase'
import { authErrorMessage, completeMagicLink, getRememberedEmail, isMagicLink, takePendingProfile } from '../lib/magicLink'
import { createClientProfile, roleHome } from '../lib/users'
import type { UserProfile } from '../lib/users'

type Status = 'working' | 'needEmail' | 'error'

/** Pantalla a la que llega la persona al abrir el enlace del correo. */
export function VerifyLink() {
  const navigate = useNavigate()
  const started = useRef(false)
  const [status, setStatus] = useState<Status>('working')
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  async function finish(correo: string) {
    setStatus('working')
    setError(null)
    try {
      const user = await completeMagicLink(correo, window.location.href)
      const pending = takePendingProfile()
      const snap = await getDoc(doc(db, 'usuarios', user.uid))

      if (snap.exists()) {
        navigate(roleHome[(snap.data() as UserProfile).rol], { replace: true })
      } else if (pending) {
        await createClientProfile(user.uid, user.email ?? correo, pending)
        navigate('/cliente', { replace: true })
      } else {
        navigate('/completar-perfil', { replace: true })
      }
    } catch (err) {
      setError(authErrorMessage(err))
      setStatus('error')
    }
  }

  useEffect(() => {
    // El enlace solo se puede usar una vez: evitamos procesarlo dos veces.
    if (started.current) return
    started.current = true

    if (!isMagicLink(window.location.href)) {
      setError('Este enlace no es válido. Pide uno nuevo desde "Iniciar sesión".')
      setStatus('error')
      return
    }
    const remembered = getRememberedEmail()
    if (remembered) void finish(remembered)
    else setStatus('needEmail')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void finish(email)
  }

  return (
    <AuthLayout>
      {status === 'working' && (
        <div className="flex flex-col items-center py-10 text-center">
          <LoaderCircle className="size-10 animate-spin text-brand-600" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-slate-800">Verificando tu enlace…</p>
        </div>
      )}

      {status === 'needEmail' && (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Confirma tu correo</h1>
          <p className="mt-2 text-slate-500">
            Abriste el enlace en un navegador distinto al que usaste para pedirlo. Escribe tu correo para
            continuar.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              aria-label="Correo electrónico"
            />
            <button type="submit" className={`${buttonPrimary} w-full py-3`}>
              Continuar
            </button>
          </form>
        </>
      )}

      {status === 'error' && (
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <CircleAlert className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">No pudimos completar el ingreso</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <Link to="/ingresar" className={`${buttonPrimary} mt-6`}>
            Pedir un enlace nuevo
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
