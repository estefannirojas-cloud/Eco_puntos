import { Coins, LoaderCircle, Search, TriangleAlert, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/context'
import { Modal } from '../../components/Modal'
import { Card, EmptyState, PageTitle, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import { formatPoints } from '../../lib/format'
import { POINTS_DISCLAIMER, adjustPoints, friendlyMessage, setUserRole, useUsers } from '../../lib/rewards'
import type { UserRow } from '../../lib/rewards'
import { pointsOf, roleLabels } from '../../lib/users'
import type { Role } from '../../lib/users'

function AdjustForm({ target, onDone }: { target: UserRow; onDone: () => void }) {
  const { user } = useAuth()
  const [mode, setMode] = useState<'sumar' | 'restar'>('sumar')
  const [amount, setAmount] = useState<number>(NaN)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const balance = pointsOf(target)
  const delta = Number.isInteger(amount) && amount > 0 ? (mode === 'sumar' ? amount : -amount) : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (delta === 0) return setError('Escribe una cantidad entera mayor que 0.')
    if (balance + delta < 0) return setError('El saldo no puede quedar en negativo.')
    setSaving(true)
    setError(null)
    try {
      await adjustPoints(user.uid, target.uid, delta, reason)
      onDone()
    } catch (err) {
      setError(friendlyMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">{target.nombre}</p>
        <p className="text-slate-500">{target.correo}</p>
        <p className="mt-2 text-slate-600">
          Saldo actual: <span className="font-semibold">{formatPoints(balance)} puntos</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de ajuste">
        {(['sumar', 'restar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ring-1 transition ${
              mode === m ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {m === 'sumar' ? 'Sumar puntos' : 'Restar puntos'}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-700">Cantidad de puntos</label>
        <input id="amount" type="number" required min={1} step={1} value={Number.isNaN(amount) ? '' : amount} onChange={(e) => setAmount(e.target.valueAsNumber)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-slate-700">Motivo</label>
        <input id="reason" required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="Ej.: Puntos de prueba, corrección de una entrega…" />
        <p className="mt-1 text-xs text-slate-500">Queda registrado en el historial de la persona.</p>
      </div>

      {delta !== 0 && (
        <p className="text-sm text-slate-600">
          Nuevo saldo: <span className="font-semibold text-brand-800">{formatPoints(Math.max(0, balance + delta))} puntos</span>
        </p>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Guardar ajuste
        </button>
      </div>
    </form>
  )
}

export function UsersAdmin() {
  const { user } = useAuth()
  const { data, loading, error } = useUsers()
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<UserRow | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [roleError, setRoleError] = useState<string | null>(null)

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? data.filter((u) => u.nombre.toLowerCase().includes(term) || u.correo.toLowerCase().includes(term)) : data
  }, [data, search])

  async function changeRole(target: UserRow, rol: Role) {
    setBusy(target.uid)
    setRoleError(null)
    try {
      await setUserRole(target.uid, rol)
    } catch (err) {
      setRoleError(friendlyMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageTitle title="Usuarios" description="Personas registradas, sus roles y su saldo de EcoPuntos." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Mientras se construye el registro de entregas de reciclaje, puedes asignar puntos con un ajuste manual. {POINTS_DISCLAIMER}
        </p>
        <div className="relative sm:w-72 sm:shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo" className={`${inputClass} pl-9`} aria-label="Buscar usuarios" />
        </div>
      </div>

      {roleError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{roleError}</p>}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudieron cargar los usuarios" description={error} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No hay usuarios para mostrar" description="Ninguna persona coincide con la búsqueda." />
        </Card>
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {visible.map((u) => {
              const isMe = u.uid === user?.uid
              return (
                <li key={u.uid} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold uppercase text-brand-800">
                      {u.nombre.trim().charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {u.nombre} {isMe && <span className="text-xs font-normal text-slate-400">(tú)</span>}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {u.correo}
                        {u.ciudad && ` · ${u.ciudad}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
                      <Coins className="size-4" aria-hidden="true" />
                      {formatPoints(pointsOf(u))}
                    </span>
                    <select
                      value={u.rol}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      disabled={isMe || busy === u.uid}
                      title={isMe ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
                      aria-label={`Rol de ${u.nombre}`}
                      className={`${inputClass} w-auto py-2 text-sm`}
                    >
                      {(Object.keys(roleLabels) as Role[]).map((r) => (
                        <option key={r} value={r}>{roleLabels[r]}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setAdjusting(u)} className={`${buttonSecondary} px-3 py-2 text-sm`}>
                      Ajustar puntos
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Modal open={adjusting !== null} title="Ajustar puntos" onClose={() => setAdjusting(null)}>
        {adjusting && <AdjustForm key={adjusting.uid} target={adjusting} onDone={() => setAdjusting(null)} />}
      </Modal>
    </>
  )
}
