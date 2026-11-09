import { Check, LoaderCircle, PackageCheck, Receipt, Search, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/context'
import { Modal } from '../../components/Modal'
import { StatusBadge } from '../../components/StatusBadge'
import { Card, EmptyState, PageTitle, buttonDanger, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import { changeRedemptionStatus, friendlyMessage, nextStatuses, statusMeta, useAllRedemptions } from '../../lib/rewards'
import type { Redemption, RedemptionStatus } from '../../lib/rewards'

type Filter = 'todas' | RedemptionStatus

const actionText: Record<RedemptionStatus, { button: string; title: string; help: string }> = {
  aprobada: {
    button: 'Aprobar',
    title: 'Aprobar solicitud',
    help: 'El cliente verá que su canje fue aprobado y podrá presentar su código.',
  },
  entregada: {
    button: 'Marcar entregada',
    title: 'Marcar como entregada',
    help: 'Confirma que el cliente ya recibió el beneficio. Este paso es final.',
  },
  rechazada: {
    button: 'Rechazar',
    title: 'Rechazar solicitud',
    help: 'Los puntos se devolverán automáticamente al cliente y la unidad volverá al catálogo. Este paso es final.',
  },
  pendiente: { button: '', title: '', help: '' },
}

export function RedemptionsAdmin() {
  const { user } = useAuth()
  const { data, loading, error } = useAllRedemptions()
  const [filter, setFilter] = useState<Filter>('pendiente')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState<{ redemption: Redemption; next: RedemptionStatus } | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todas: data.length, pendiente: 0, aprobada: 0, entregada: 0, rechazada: 0 }
    for (const r of data) c[r.estado] += 1
    return c
  }, [data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.filter(
      (r) =>
        (filter === 'todas' || r.estado === filter) &&
        (!term ||
          r.codigo.toLowerCase().includes(term) ||
          r.correo.toLowerCase().includes(term) ||
          r.nombreCliente.toLowerCase().includes(term) ||
          r.recompensaNombre.toLowerCase().includes(term)),
    )
  }, [data, filter, search])

  function openAction(redemption: Redemption, next: RedemptionStatus) {
    setAction({ redemption, next })
    setNote('')
    setActionError(null)
  }

  async function confirmAction() {
    if (!user || !action) return
    if (action.next === 'rechazada' && !note.trim()) {
      setActionError('Escribe el motivo del rechazo; el cliente lo verá.')
      return
    }
    setSaving(true)
    setActionError(null)
    try {
      await changeRedemptionStatus(user.uid, action.redemption.codigo, action.next, note)
      setAction(null)
    } catch (err) {
      setActionError(friendlyMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const tabs: Filter[] = ['pendiente', 'aprobada', 'entregada', 'rechazada', 'todas']

  return (
    <>
      <PageTitle title="Solicitudes de canje" description="Revisa, aprueba y entrega las recompensas solicitadas. Las solicitudes nunca se borran: son el historial de redenciones." />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === t ? 'bg-brand-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'todas' ? 'Historial completo' : `${statusMeta[t].label}s`}
              <span className={`rounded-full px-1.5 text-xs ${filter === t ? 'bg-white/20' : 'bg-slate-100'}`}>{counts[t]}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código, cliente o recompensa"
            className={`${inputClass} pl-9`}
            aria-label="Buscar solicitudes"
          />
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
        ) : error ? (
          <EmptyState icon={TriangleAlert} title="No se pudieron cargar las solicitudes" description={error} />
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={Receipt}
              title="No hay solicitudes aquí"
              description={search ? 'Ninguna solicitud coincide con la búsqueda.' : 'Cuando los clientes canjeen recompensas, sus solicitudes aparecerán aquí.'}
            />
          </Card>
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-slate-100">
              {visible.map((r) => (
                <li key={r.codigo} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-wider text-brand-900">{r.codigo}</span>
                      <StatusBadge status={r.estado} />
                    </div>
                    <p className="mt-1.5 font-semibold text-slate-900">{r.recompensaNombre}</p>
                    <p className="text-sm text-slate-500">
                      {r.nombreCliente} · {r.correo}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatPoints(r.puntos)} puntos · Solicitada {formatDate(r.creadoEn)}
                      {r.estado !== 'pendiente' && ` · Actualizada ${formatDate(r.actualizadoEn)}`}
                    </p>
                    {r.nota && <p className="mt-1 text-sm text-slate-600">Nota: {r.nota}</p>}
                  </div>
                  {nextStatuses[r.estado].length > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {nextStatuses[r.estado].map((next) => (
                        <button
                          key={next}
                          type="button"
                          onClick={() => openAction(r, next)}
                          className={`${next === 'rechazada' ? buttonSecondary : buttonPrimary} px-3 py-2 text-sm`}
                        >
                          {next === 'rechazada' ? (
                            <X className="size-4" aria-hidden="true" />
                          ) : next === 'entregada' ? (
                            <PackageCheck className="size-4" aria-hidden="true" />
                          ) : (
                            <Check className="size-4" aria-hidden="true" />
                          )}
                          {actionText[next].button}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Modal open={action !== null} title={action ? actionText[action.next].title : ''} onClose={() => setAction(null)} locked={saving}>
        {action && (
          <div>
            <dl className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Código</dt>
                <dd className="font-mono font-bold text-brand-900">{action.redemption.codigo}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Recompensa</dt>
                <dd className="text-right font-medium text-slate-800">{action.redemption.recompensaNombre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Cliente</dt>
                <dd className="text-right text-slate-800">{action.redemption.nombreCliente}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Puntos</dt>
                <dd className="text-slate-800">{formatPoints(action.redemption.puntos)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate-600">{actionText[action.next].help}</p>
            <label htmlFor="nota" className="mb-1.5 mt-4 block text-sm font-medium text-slate-700">
              {action.next === 'rechazada' ? 'Motivo del rechazo' : 'Nota'}{' '}
              {action.next !== 'rechazada' && <span className="font-normal text-slate-400">(opcional)</span>}
            </label>
            <textarea id="nota" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
            {actionError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAction(null)} disabled={saving} className={buttonSecondary}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={saving}
                className={action.next === 'rechazada' ? buttonDanger : buttonPrimary}
              >
                {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                {actionText[action.next].button}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
