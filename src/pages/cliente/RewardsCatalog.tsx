import { Check, Coins, Copy, Gift, Info, LoaderCircle, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context'
import { Modal } from '../../components/Modal'
import { RewardCard } from '../../components/RewardCard'
import { RewardVisual } from '../../components/RewardVisual'
import { EmptyState, PageTitle, buttonPrimary, buttonSecondary } from '../../components/ui'
import { formatPoints } from '../../lib/format'
import {
  POINTS_DISCLAIMER,
  availability,
  categories,
  friendlyMessage,
  generateRedemptionCode,
  redeemReward,
  useRewards,
} from '../../lib/rewards'
import type { Category, Reward } from '../../lib/rewards'
import { pointsOf } from '../../lib/users'

type Filter = 'todas' | Category

/** Saldo del cliente, destacado arriba del catálogo. */
export function BalanceBanner({ balance }: { balance: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white shadow-lg sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-lime-accent/10" aria-hidden="true" />
      <p className="text-sm font-medium text-brand-200">Tus EcoPuntos disponibles</p>
      <p className="mt-1 flex items-center gap-2 text-4xl font-extrabold tracking-tight">
        {formatPoints(balance)}
        <Coins className="size-7 text-lime-accent" aria-hidden="true" />
      </p>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-brand-200/90">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {POINTS_DISCLAIMER}
      </p>
    </div>
  )
}

export function RewardsCatalog() {
  const { user, profile } = useAuth()
  const balance = pointsOf(profile)
  const { data: rewards, loading, error } = useRewards()
  const [filter, setFilter] = useState<Filter>('todas')
  const [onlyAffordable, setOnlyAffordable] = useState(false)

  // Estado de la ventana de canje
  const [selected, setSelected] = useState<Reward | null>(null)
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState<'confirm' | 'working' | 'done'>('confirm')
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const visible = useMemo(
    () =>
      rewards.filter(
        (r) =>
          r.activa &&
          (filter === 'todas' || r.categoria === filter) &&
          (!onlyAffordable || (r.puntos <= balance && r.stock > 0)),
      ),
    [rewards, filter, onlyAffordable, balance],
  )

  function openRedeem(reward: Reward) {
    setSelected(reward)
    // El código se genera UNA vez por solicitud: si se confirma dos veces, no se descuenta dos veces.
    setCode(generateRedemptionCode())
    setPhase('confirm')
    setRedeemError(null)
    setCopied(false)
  }

  function closeRedeem() {
    if (phase === 'working') return
    setSelected(null)
  }

  async function confirmRedeem() {
    if (!user || !selected) return
    setPhase('working')
    setRedeemError(null)
    try {
      await redeemReward(user.uid, selected.id, code)
      setPhase('done')
    } catch (err) {
      setRedeemError(friendlyMessage(err))
      setPhase('confirm')
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const live = selected ? (rewards.find((r) => r.id === selected.id) ?? selected) : null
  const missing = live ? Math.max(0, live.puntos - balance) : 0
  const canConfirm = live !== null && availability(live).available && missing === 0

  return (
    <>
      <PageTitle title="Recompensas" description="Cambia tus EcoPuntos por beneficios de nuestras empresas aliadas." />

      <BalanceBanner balance={balance} />

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['todas', ...Object.keys(categories)] as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === key ? 'bg-brand-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {key === 'todas' ? 'Todas' : categories[key].label}
            </button>
          ))}
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={onlyAffordable}
            onChange={(e) => setOnlyAffordable(e.target.checked)}
            className="size-4 rounded accent-brand-700"
          />
          Solo las que puedo canjear
        </label>
      </div>

      {/* Catálogo */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={TriangleAlert} title="No se pudo cargar el catálogo" description={error} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={rewards.length === 0 ? 'Aún no hay recompensas' : 'No hay recompensas con este filtro'}
            description={
              rewards.length === 0
                ? 'Pronto nuestras empresas aliadas publicarán beneficios para ti.'
                : 'Prueba con otra categoría o desactiva "Solo las que puedo canjear".'
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((reward) => {
              const status = availability(reward)
              const lack = reward.puntos - balance
              return (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  footer={
                    !status.available ? (
                      <button type="button" disabled className={`${buttonSecondary} w-full opacity-60`}>
                        {status.label}
                      </button>
                    ) : lack > 0 ? (
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-400"
                            style={{ width: `${Math.min(100, (balance / reward.puntos) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Te faltan <span className="font-semibold text-slate-700">{formatPoints(lack)}</span> puntos
                        </p>
                      </div>
                    ) : (
                      <button type="button" onClick={() => openRedeem(reward)} className={`${buttonPrimary} w-full`}>
                        <Gift className="size-4" aria-hidden="true" />
                        Canjear
                      </button>
                    )
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Ventana de canje */}
      <Modal
        open={live !== null}
        title={phase === 'done' ? '¡Canje realizado!' : 'Confirmar canje'}
        onClose={closeRedeem}
        locked={phase === 'working'}
      >
        {live && phase !== 'done' && (
          <div>
            <div className="flex gap-4">
              <RewardVisual reward={live} className="size-20 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{live.empresa}</p>
                <p className="mt-0.5 font-semibold text-slate-900">{live.nombre}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{live.descripcion}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Tu saldo actual</dt>
                <dd className="font-medium text-slate-800">{formatPoints(balance)} puntos</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Costo de la recompensa</dt>
                <dd className="font-medium text-red-600">− {formatPoints(live.puntos)} puntos</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-700">Saldo después del canje</dt>
                <dd className="font-bold text-brand-800">{formatPoints(Math.max(0, balance - live.puntos))} puntos</dd>
              </div>
            </dl>

            {!availability(live).available && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Esta recompensa ya no está disponible.</p>
            )}
            {availability(live).available && missing > 0 && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Te faltan {formatPoints(missing)} puntos para esta recompensa.
              </p>
            )}
            {redeemError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {redeemError}
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck className="mt-px size-4 shrink-0 text-brand-600" aria-hidden="true" />
              Los puntos se descuentan en una sola operación segura y recibirás un código único. {POINTS_DISCLAIMER}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeRedeem} disabled={phase === 'working'} className={buttonSecondary}>
                Cancelar
              </button>
              <button type="button" onClick={confirmRedeem} disabled={!canConfirm || phase === 'working'} className={buttonPrimary}>
                {phase === 'working' && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                {phase === 'working' ? 'Procesando…' : `Canjear por ${formatPoints(live.puntos)} puntos`}
              </button>
            </div>
          </div>
        )}

        {live && phase === 'done' && (
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Check className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-slate-600">
              Solicitaste <span className="font-semibold text-slate-900">{live.nombre}</span>. Este es tu código de redención:
            </p>
            <div className="mx-auto mt-4 flex max-w-xs items-center justify-between gap-3 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3">
              <span className="font-mono text-xl font-bold tracking-wider text-brand-900">{code}</span>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-lg p-2 text-brand-700 hover:bg-brand-100"
                aria-label="Copiar código"
              >
                {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Tu solicitud quedó <span className="font-semibold text-amber-700">pendiente de aprobación</span>. Puedes ver su
              estado en "Mis canjes".
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={closeRedeem} className={buttonSecondary}>
                Seguir explorando
              </button>
              <Link to="/cliente/canjes" className={buttonPrimary}>
                Ver mis canjes
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
