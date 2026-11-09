import { Check, Gift, Receipt, TriangleAlert, Undo2, X } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context'
import { StatusBadge } from '../../components/StatusBadge'
import { Card, EmptyState, PageTitle, buttonPrimary } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import { statusMeta, useMyRedemptions } from '../../lib/rewards'
import type { Redemption } from '../../lib/rewards'

const steps = ['Solicitada', 'Aprobada', 'Entregada'] as const

function progressIndex(r: Redemption) {
  if (r.estado === 'entregada') return 2
  if (r.estado === 'aprobada') return 1
  return 0
}

/** Línea de avance: Solicitada → Aprobada → Entregada. */
function StatusSteps({ redemption }: { redemption: Redemption }) {
  if (redemption.estado === 'rechazada') {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
        <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">Solicitud rechazada</p>
          {redemption.nota && <p className="mt-0.5 text-red-600">Motivo: {redemption.nota}</p>}
          <p className="mt-1 flex items-center gap-1 text-red-600">
            <Undo2 className="size-3.5" aria-hidden="true" />
            Se devolvieron {formatPoints(redemption.puntos)} puntos a tu saldo.
          </p>
        </div>
      </div>
    )
  }

  const current = progressIndex(redemption)
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => (
        <li key={label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center gap-1">
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= current ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
              }`}
            >
              {i <= current ? <Check className="size-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`text-xs ${i <= current ? 'font-medium text-slate-700' : 'text-slate-400'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className={`mx-2 mb-5 h-0.5 flex-1 rounded ${i < current ? 'bg-brand-500' : 'bg-slate-200'}`} />
          )}
        </li>
      ))}
    </ol>
  )
}

export function MyRedemptions() {
  const { user } = useAuth()
  const { data, loading, error } = useMyRedemptions(user?.uid)

  return (
    <>
      <PageTitle title="Mis canjes" description="Consulta el estado de tus solicitudes y tus códigos de redención." />

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudo cargar tu historial" description={error} />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="Aún no has hecho canjes"
            description="Cuando canjees una recompensa, aquí verás su código y en qué estado va."
            action={
              <Link to="/cliente/recompensas" className={buttonPrimary}>
                <Gift className="size-4" aria-hidden="true" />
                Ver recompensas
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((r) => (
            <Card key={r.codigo}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.estado} />
                    <span className="text-xs text-slate-400">{formatDate(r.creadoEn)}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{r.recompensaNombre}</h2>
                  <p className="text-sm text-slate-500">
                    {r.empresa} · {formatPoints(r.puntos)} puntos
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 px-4 py-2 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Código</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-brand-900">{r.codigo}</p>
                </div>
              </div>
              <div className="mt-5">
                <StatusSteps redemption={r} />
              </div>
              <p className="mt-4 text-sm text-slate-500">{statusMeta[r.estado].description}</p>
              {r.nota && r.estado !== 'rechazada' && <p className="mt-1 text-sm text-slate-600">Nota: {r.nota}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
