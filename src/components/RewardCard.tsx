import { Building2, Coins, FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatPoints } from '../lib/format'
import { availability } from '../lib/rewards'
import type { Reward } from '../lib/rewards'
import { RewardVisual } from './RewardVisual'

/** Tarjeta de una recompensa del catálogo. */
export function RewardCard({ reward, footer }: { reward: Reward; footer: ReactNode }) {
  const status = availability(reward)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <RewardVisual reward={reward} />
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
              status.available ? 'bg-white/95 text-brand-800' : 'bg-slate-900/80 text-white'
            }`}
          >
            {status.label}
          </span>
          {reward.demo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/95 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-sm">
              <FlaskConical className="size-3.5" aria-hidden="true" />
              Ejemplo demostrativo
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
          <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{reward.empresa}</span>
        </p>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">{reward.nombre}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-slate-500">{reward.descripcion}</p>

        <div className="mt-auto pt-5">
          <p className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight text-brand-900">
            <Coins className="size-5 text-lime-600" aria-hidden="true" />
            {formatPoints(reward.puntos)}
            <span className="text-sm font-medium text-slate-500">puntos</span>
          </p>
          <div className="mt-4">{footer}</div>
        </div>
      </div>
    </article>
  )
}
