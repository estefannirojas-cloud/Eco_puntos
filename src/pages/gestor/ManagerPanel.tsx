import {
  ClipboardList,
  Coins,
  Hourglass,
  LayoutDashboard,
  LoaderCircle,
  PackagePlus,
  Scale,
  Search,
  TriangleAlert,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react"
import { useMemo, useState } from 'react'
import { Route, Routes } from 'react-router'
import { useActor, useAuth } from '../../auth/context'
import { DeliveryForm } from '../../components/DeliveryForm'
import { Modal } from '../../components/Modal'
import { DeliveryStatusBadge, PointProfile } from '../../components/recycling'
import { Card, CardHeader, ComingSoon, EmptyState, PageTitle, StatCard, buttonDanger, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import { ProfilePage } from "../ProfilePage"
import { formatDate, formatPoints } from '../../lib/format'
import {
  calculatePoints,
  deliveryDate,
  registerValidatedDelivery,
  rejectDelivery,
  roundKg,
  useAllDeliveries,
  useMaterials,
  usePoints,
  validateDelivery,
} from '../../lib/recycling'
import type { CollectionPoint, Delivery, DeliveryStatus, Material } from '../../lib/recycling'
import { friendlyMessage } from '../../lib/rewards'

const nav: NavItem[] = [
  { to: '/gestor', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/gestor/recepciones', label: 'Recepciones', icon: ClipboardList },
  { to: '/gestor/clientes', label: 'Clientes', icon: Users },
  { to: '/gestor/punto-acopio', label: 'Mis puntos de acopio', icon: Warehouse },
  { to: "/gestor/perfil", label: "Mi perfil", icon: UserRound },
]

/** Puntos donde esta persona puede validar: los asignados (o todos, si es administrador). */
function useMyPoints() {
  const { user, profile } = useAuth()
  const points = usePoints()
  const mine = points.data.filter((p) => profile?.rol === 'admin' || (user && p.gestores?.includes(user.uid)))
  return { ...points, data: mine }
}

function isToday(d: Delivery) {
  const date = deliveryDate(d)
  return date ? date.toDateString() === new Date().toDateString() : false
}

// ---------------------------------------------------------------------
// Validar o rechazar una entrega pendiente
// ---------------------------------------------------------------------

function ReviewModal({ delivery, materials, onClose }: { delivery: Delivery | null; materials: Material[]; onClose: () => void }) {
  const actor = useActor()
  const [mode, setMode] = useState<'validar' | 'rechazar'>('validar')
  const [kg, setKg] = useState<number>(delivery?.pesoDeclarado ?? NaN)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!delivery) return null
  const material = materials.find((m) => m.id === delivery.materialId)
  const weight = Number.isFinite(kg) ? roundKg(kg) : NaN
  const belowMin = material && Number.isFinite(weight) ? weight < material.pesoMinimo : false
  const estimate = material && Number.isFinite(weight) ? calculatePoints(weight, material.puntosPorKg) : 0

  async function confirm() {
    if (!actor || !delivery) return
    setSaving(true)
    setError(null)
    try {
      if (mode === 'validar') await validateDelivery(actor, delivery.id, weight)
      else await rejectDelivery(actor, delivery.id, reason)
      onClose()
    } catch (err) {
      setError(friendlyMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <dl className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-slate-500">Cliente</dt><dd className="text-right font-medium text-slate-800">{delivery.clienteNombre}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-500">Punto</dt><dd className="text-right text-slate-800">{delivery.puntoNombre}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-500">Material</dt><dd className="text-right text-slate-800">{delivery.materialNombre}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-500">Peso declarado</dt><dd className="text-slate-800">{delivery.pesoDeclarado.toLocaleString('es-CO')} kg</dd></div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Decisión">
        {(['validar', 'rechazar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ring-1 ${mode === m ? (m === 'validar' ? 'bg-brand-700 text-white ring-brand-700' : 'bg-red-600 text-white ring-red-600') : 'bg-white text-slate-600 ring-slate-300'}`}
          >
            {m === 'validar' ? 'Validar' : 'Rechazar'}
          </button>
        ))}
      </div>

      {mode === 'validar' ? (
        <div className="mt-4">
          <label htmlFor="r-kg" className="mb-1.5 block text-sm font-medium text-slate-700">Peso aceptado (kg), según la báscula</label>
          <input id="r-kg" type="number" min={0} step={0.01} value={Number.isNaN(kg) ? '' : kg} onChange={(e) => setKg(e.target.valueAsNumber)} className={inputClass} />
          {material ? (
            <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${belowMin ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-900'}`}>
              {belowMin
                ? `No cumple el peso mínimo de ${material.pesoMinimo.toLocaleString('es-CO')} kg.`
                : `${weight.toLocaleString('es-CO')} kg × ${formatPoints(material.puntosPorKg)} pts/kg (tarifa vigente) = ${formatPoints(estimate)} puntos`}
            </p>
          ) : (
            <p className="mt-3 text-sm text-red-700">El material ya no existe; esta entrega solo se puede rechazar.</p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="r-reason" className="mb-1.5 block text-sm font-medium text-slate-700">Motivo del rechazo (el cliente lo verá)</label>
          <textarea id="r-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="Ej.: El material llegó mojado / no se presentó en el punto" />
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving || (mode === 'validar' && (!material || belowMin || !Number.isFinite(weight))) || (mode === 'rechazar' && !reason.trim())}
          className={mode === 'validar' ? buttonPrimary : buttonDanger}
        >
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {mode === 'validar' ? `Validar y acreditar ${formatPoints(estimate)} puntos` : 'Rechazar entrega'}
        </button>
      </div>
    </div>
  )
}

function PendingList({ deliveries, materials }: { deliveries: Delivery[]; materials: Material[] }) {
  const [reviewing, setReviewing] = useState<Delivery | null>(null)
  if (deliveries.length === 0) {
    return <EmptyState icon={Hourglass} title="No hay entregas por validar" description="Las entregas que registren los clientes en tus puntos aparecerán aquí." />
  }
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {deliveries.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{d.clienteNombre}</p>
              <p className="truncate text-sm text-slate-500">
                {d.materialNombre} · {d.pesoDeclarado.toLocaleString('es-CO')} kg · {d.puntoNombre}
              </p>
              <p className="text-xs text-slate-400">{formatDate(d.creadoEn)}</p>
            </div>
            <button type="button" onClick={() => setReviewing(d)} className={`${buttonPrimary} shrink-0 px-3 py-2 text-sm`}>
              Revisar
            </button>
          </li>
        ))}
      </ul>
      <Modal open={reviewing !== null} title="Revisar entrega" onClose={() => setReviewing(null)}>
        {reviewing && <ReviewModal key={reviewing.id} delivery={reviewing} materials={materials} onClose={() => setReviewing(null)} />}
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------

function Overview() {
  const actor = useActor()
  const myPoints = useMyPoints()
  const materials = useMaterials()
  const deliveries = useAllDeliveries()
  const pointIds = new Set(myPoints.data.map((p) => p.id))
  const mine = deliveries.data.filter((d) => pointIds.has(d.puntoId))
  const today = mine.filter((d) => d.estado === 'validada' && isToday(d))
  const pending = mine.filter((d) => d.estado === 'pendiente')
  const loading = deliveries.loading || myPoints.loading

  return (
    <>
      <PageTitle title="Panel del gestor" description="Registra y valida las entregas de material en tus puntos de acopio." />

      {!myPoints.loading && myPoints.data.length === 0 && (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Aún no tienes puntos de acopio asignados. Pide al administrador que te asigne uno.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Recepciones de hoy" icon={ClipboardList} value={loading ? undefined : String(today.length)} hint="Entregas validadas hoy" />
        <StatCard label="Kilos recibidos hoy" icon={Scale} value={loading ? undefined : `${today.reduce((s, d) => s + (d.pesoAceptado ?? 0), 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`} hint="En tus puntos" />
        <StatCard label="Puntos otorgados hoy" icon={Coins} value={loading ? undefined : formatPoints(today.reduce((s, d) => s + (d.puntos ?? 0), 0))} hint="A los clientes" />
        <StatCard label="Por validar" icon={Hourglass} value={loading ? undefined : String(pending.length)} hint="Registradas por clientes" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Registrar recepción" description="Material entregado por un cliente en el punto" icon={PackagePlus} />
          {myPoints.loading || materials.loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <DeliveryForm
              mode="gestor"
              points={myPoints.data}
              materials={materials.data}
              onSubmit={async ({ deliveryId, point, material, kg, client }) => {
                if (!actor || !client) return
                return registerValidatedDelivery(deliveryId, actor, client.uid, point.id, material.id, kg)
              }}
            />
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Entregas por validar" description="Pre-registradas por los clientes en tus puntos" icon={Hourglass} />
          {loading ? <div className="h-40 animate-pulse rounded-xl bg-slate-100" /> : <PendingList deliveries={pending} materials={materials.data} />}
        </Card>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------
// Recepciones (historial)
// ---------------------------------------------------------------------

function Receptions() {
  const myPoints = useMyPoints()
  const materials = useMaterials()
  const deliveries = useAllDeliveries()
  const [status, setStatus] = useState<'todas' | DeliveryStatus>('todas')
  const [pointId, setPointId] = useState('')
  const [search, setSearch] = useState('')

  const pointIds = useMemo(() => new Set(myPoints.data.map((p) => p.id)), [myPoints.data])
  const term = search.trim().toLowerCase()
  const visible = deliveries.data.filter(
    (d) =>
      pointIds.has(d.puntoId) &&
      (status === 'todas' || d.estado === status) &&
      (!pointId || d.puntoId === pointId) &&
      (!term || `${d.clienteNombre} ${d.clienteCorreo} ${d.materialNombre}`.toLowerCase().includes(term)),
  )
  const pending = visible.filter((d) => d.estado === 'pendiente')

  return (
    <>
      <PageTitle title="Recepciones" description="Historial de entregas en tus puntos de acopio." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o material" className={`${inputClass} pl-9`} aria-label="Buscar" />
        </div>
        <select value={pointId} onChange={(e) => setPointId(e.target.value)} className={inputClass} aria-label="Punto de acopio">
          <option value="">Todos mis puntos</option>
          {myPoints.data.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'todas' | DeliveryStatus)} className={inputClass} aria-label="Estado">
          <option value="todas">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="validada">Validadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>

      {deliveries.loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : deliveries.error ? (
        <EmptyState icon={TriangleAlert} title="No se pudieron cargar las entregas" description={deliveries.error} />
      ) : visible.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="Sin recepciones" description="No hay entregas con estos filtros." /></Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card className="mb-6">
              <CardHeader title="Por validar" icon={Hourglass} />
              <PendingList deliveries={pending} materials={materials.data} />
            </Card>
          )}
          <Card className="overflow-x-auto p-0 sm:p-0">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 text-right font-semibold">Peso</th>
                  <th className="px-4 py-3 text-right font-semibold">Puntos</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Validó</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(d.validadoEn ?? d.creadoEn)}</td>
                    <td className="px-4 py-3"><span className="font-medium text-slate-900">{d.clienteNombre}</span><br /><span className="text-xs text-slate-500">{d.puntoNombre}</span></td>
                    <td className="px-4 py-3 text-slate-700">{d.materialNombre}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{(d.pesoAceptado ?? d.pesoDeclarado).toLocaleString('es-CO')} kg</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-800">{d.estado === 'validada' ? formatPoints(d.puntos ?? 0) : '—'}</td>
                    <td className="px-4 py-3"><DeliveryStatusBadge status={d.estado} /></td>
                    <td className="px-4 py-3 text-slate-600">{d.validadorNombre ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  )
}

// ---------------------------------------------------------------------
// Mis puntos de acopio
// ---------------------------------------------------------------------

function MyPointsPage() {
  const myPoints = useMyPoints()
  const materials = useMaterials()
  return (
    <>
      <PageTitle title="Mis puntos de acopio" description="Información, horarios y materiales de los puntos donde validas entregas." />
      {myPoints.loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : myPoints.data.length === 0 ? (
        <Card><EmptyState icon={Warehouse} title="Sin puntos asignados" description="El administrador debe asignarte a un punto de acopio." /></Card>
      ) : (
        <div className="space-y-6">
          {myPoints.data.map((p: CollectionPoint) => (
            <Card key={p.id}>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">{p.nombre}</h2>
              <PointProfile point={p} materials={materials.data} />
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

export function ManagerPanel() {
  return (
    <DashboardLayout roleLabel="Gestor de reciclaje" nav={nav}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="recepciones" element={<Receptions />} />
        <Route
          path="clientes"
          element={
            <ComingSoon
              title="Clientes"
              description="Personas que entregan material en tu punto."
              icon={UserRound}
              features={['Buscar clientes por nombre o correo', 'Ver el historial de cada cliente', 'Consultar su saldo de puntos', 'Verificar la identidad al recibir']}
            />
          }
        />
        <Route path="punto-acopio" element={<MyPointsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Routes>
    </DashboardLayout>
  )
}
