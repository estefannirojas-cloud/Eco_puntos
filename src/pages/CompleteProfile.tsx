import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { FullPageLoader } from '../components/FullPageLoader'
import { buttonPrimary, inputClass } from '../components/ui'
import { AuthLayout } from '../layouts/AuthLayout'
import { createClientProfile, roleHome } from '../lib/users'

/** Para quien ya ingresó con el enlace pero aún no tiene perfil guardado. */
export function CompleteProfile() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', celular: '', ciudad: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/ingresar" replace />
  if (profile) return <Navigate to={roleHome[profile.rol]} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user?.email) return
    setSaving(true)
    setError(null)
    try {
      await createClientProfile(user.uid, user.email, form)
      navigate('/cliente', { replace: true })
    } catch {
      setError('No se pudieron guardar tus datos. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Completa tu perfil</h1>
      <p className="mt-2 text-slate-500">
        Ingresaste como <span className="font-semibold text-slate-700">{user.email}</span>. Cuéntanos un poco
        sobre ti para terminar.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre completo
          </label>
          <input id="name" required maxLength={100} autoComplete="name" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Celular <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input id="phone" type="tel" maxLength={20} autoComplete="tel" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-700">
              Ciudad o municipio
            </label>
            <input id="city" required maxLength={60} autoComplete="address-level2" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className={inputClass} />
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={saving} className={`${buttonPrimary} w-full py-3`}>
          {saving && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          Guardar y continuar
        </button>
      </form>
    </AuthLayout>
  )
}
