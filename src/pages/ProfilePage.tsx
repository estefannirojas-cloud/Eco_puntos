import { doc, updateDoc } from 'firebase/firestore'
import { KeyRound, LoaderCircle, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { PasswordInput } from '../components/PasswordInput'
import { Card, CardHeader, PageTitle, buttonPrimary, inputClass } from '../components/ui'
import { db } from '../lib/firebase'
import { formatPoints } from '../lib/format'
import { authErrorMessage } from '../lib/magicLink'
import { MIN_PASSWORD_LENGTH, changePassword, passwordProblem } from '../lib/passwordAuth'
import { friendlyMessage } from '../lib/rewards'
import { pointsOf, roleLabels } from '../lib/users'

const label = 'mb-1.5 block text-sm font-medium text-slate-700'

function PersonalData() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ nombre: profile?.nombre ?? '', celular: profile?.celular ?? '', ciudad: profile?.ciudad ?? '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    try {
      // Solo se pueden cambiar estos tres datos; el rol, el correo y los puntos están protegidos.
      await updateDoc(doc(db, 'usuarios', user.uid), {
        nombre: form.nombre.trim(),
        celular: form.celular.trim(),
        ciudad: form.ciudad.trim(),
      })
      setMessage({ ok: true, text: 'Tus datos se guardaron.' })
    } catch (err) {
      setMessage({ ok: false, text: friendlyMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Datos personales" icon={UserRound} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pf-nombre" className={label}>Nombre completo</label>
          <input id="pf-nombre" required maxLength={100} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="pf-correo" className={label}>Correo electrónico</label>
          <input id="pf-correo" value={profile?.correo ?? user?.email ?? ''} disabled className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-cel" className={label}>Celular</label>
            <input id="pf-cel" type="tel" maxLength={20} value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-ciudad" className={label}>Ciudad o municipio</label>
            <input id="pf-ciudad" required maxLength={60} value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className={inputClass} />
          </div>
        </div>
        {message && (
          <p role="status" className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}`}>{message.text}</p>
        )}
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Guardar datos
        </button>
      </form>
    </Card>
  )
}

function PasswordChange() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = passwordProblem(password, confirmation)
    if (problem) return setMessage({ ok: false, text: problem })
    setSaving(true)
    setMessage(null)
    try {
      await changePassword(password)
      setPassword('')
      setConfirmation('')
      setMessage({ ok: true, text: 'Tu contraseña quedó guardada. Úsala la próxima vez que inicies sesión.' })
    } catch (err) {
      setMessage({ ok: false, text: authErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Contraseña" description="Crea o cambia la contraseña con la que inicias sesión." icon={KeyRound} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pf-pass" className={label}>Nueva contraseña</label>
          <PasswordInput id="pf-pass" value={password} onChange={setPassword} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">Mínimo {MIN_PASSWORD_LENGTH} caracteres, con letras y números.</p>
        </div>
        <div>
          <label htmlFor="pf-pass2" className={label}>Confirmar contraseña</label>
          <PasswordInput id="pf-pass2" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
        </div>
        {message && (
          <p role="status" className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700'}`}>{message.text}</p>
        )}
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Guardar contraseña
        </button>
      </form>
    </Card>
  )
}

export function ProfilePage() {
  const { profile } = useAuth()
  return (
    <>
      <PageTitle
        title="Mi perfil"
        description={profile ? `${roleLabels[profile.rol]} · ${formatPoints(pointsOf(profile))} EcoPuntos` : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {profile && <PersonalData key={profile.correo} />}
        <PasswordChange />
      </div>
    </>
  )
}
