import { ChevronDown, Info, MapPin, Package, Recycle, Search, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/context'
import { DeliveryForm } from '../../components/DeliveryForm'
import { DeliveryStatusBadge, MaterialIcon, PointProfile, PointStatusBadge, PointTypeIcon } from '../../components/recycling'
import { Card, EmptyState, PageTitle, buttonPrimary, inputClass } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import { createClientDelivery, pointTypes, useMaterials, useMyDeliveries, usePoints } from '../../lib/recycling'
import { pointsOf } from '../../lib/users'

/** El cliente pre-registra una entrega; queda pendiente hasta que un gestor la valide. */
export function RegisterDelivery() {
  const { user, profile } = useAuth()
  const points = usePoints()
  const materials = useMaterials()

  return (
    <>
      <PageTitle title="Registrar entrega" description="Cuéntanos qué material vas a entregar y en qué punto de acopio." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          {points.loading || materials.loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ) : points.error || materials.error ? (
            <EmptyState icon={TriangleAlert} title="No se pudo cargar la información" description={points.error ?? materials.error ?? ''} />
          ) : (
            <DeliveryForm
              mode="cliente"
              points={points.data}
              materials={materials.data}
              onSubmit={async ({ deliveryId, point, material, kg }) => {
                if (!user || !profile) return
                await createClientDelivery(deliveryId, { uid: user.uid, nombre: profile.nombre, correo: profile.correo }, point, material, kg)
              }}
            />
          )}
        </Card>
        <Card className="h-fit lg:col-span-2">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Info className="size-5 text-brand-600" aria-hidden="true" /> ¿Cómo funciona?
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              'Elige el punto de acopio activo más cercano.',
              'Selecciona el material: solo aparecen los que ese punto recibe.',
              'Escribe el peso. Debe cumplir el peso mínimo del material.',
              'Lleva el material al punto. El gestor lo pesa y valida la entrega.',
              'Al validarla, los puntos se suman a tu saldo automáticamente.',
            ].map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-slate-500">
            Tu saldo actual: <span className="font-semibold text-brand-800">{formatPoints(pointsOf(profile))} puntos</span>
          </p>
        </Card>
      </div>
    </>
  )
}

/** Historial de entregas del cliente. */
export function MyDeliveries() {
  const { user } = useAuth()
  const { data, loading, error } = useMyDeliveries(user?.uid)
  const validated = data.filter((d) => d.estado === 'validada')
  const totalKg = validated.reduce((s, d) => s + (d.pesoAceptado ?? 0), 0)
  const totalPoints = validated.reduce((s, d) => s + (d.puntos ?? 0), 0)

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="[&>div]:mb-0">
          <PageTitle title="Mis entregas" description="Materiales que has entregado y los puntos que te dieron." />
        </div>
        <Link to="/cliente/registrar" className={buttonPrimary}>
          <Recycle className="size-4" aria-hidden="true" /> Registrar entrega
        </Link>
      </div>

      {!loading && validated.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Kilos validados</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalKg.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg</p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Puntos ganados</p>
            <p className="mt-1 text-2xl font-bold text-brand-800">{formatPoints(totalPoints)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Entregas validadas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{validated.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudo cargar tu historial" description={error} />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Package} title="Aún no tienes entregas" description="Registra tu primera entrega y llévala a un punto de acopio." />
        </Card>
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <MaterialIcon material={{ categoria: d.materialCategoria, imagenUrl: '', nombre: d.materialNombre }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{d.materialNombre}</span>
                    <DeliveryStatusBadge status={d.estado} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {d.puntoNombre} · {formatDate(d.creadoEn)}
                  </p>
                  {d.estado === 'rechazada' && d.motivoRechazo && <p className="mt-1 text-sm text-red-600">Motivo: {d.motivoRechazo}</p>}
                  {d.estado === 'validada' && (
                    <p className="mt-1 text-xs text-slate-500">
                      Validada por {d.validadorNombre} · tarifa aplicada {formatPoints(d.tarifaAplicada ?? 0)} pts/kg
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="font-semibold tabular-nums text-slate-900">
                    {(d.pesoAceptado ?? d.pesoDeclarado).toLocaleString('es-CO')} kg
                  </p>
                  <p className={`text-sm font-semibold ${d.estado === 'validada' ? 'text-brand-700' : 'text-slate-400'}`}>
                    {d.estado === 'validada' ? `+${formatPoints(d.puntos ?? 0)} puntos` : d.estado === 'pendiente' ? 'Por validar' : 'Sin puntos'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

/** Directorio de puntos de acopio para la ciudadanía (solo los que están operando). */
export function PointsDirectory() {
  const points = usePoints()
  const materials = useMaterials()
  const [search, setSearch] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const term = search.trim().toLowerCase()
  const visible = points.data.filter(
    (p) =>
      p.estado !== 'inactivo' &&
      (!materialId || materialId in p.materiales) &&
      (!term || `${p.nombre} ${p.direccion} ${p.barrio}`.toLowerCase().includes(term)),
  )

  return (
    <>
      <PageTitle title="Puntos de acopio" description="Lugares donde puedes entregar tus materiales en Popayán." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, dirección o barrio" className={`${inputClass} pl-9`} aria-label="Buscar puntos de acopio" />
        </div>
        <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={inputClass} aria-label="Filtrar por material">
          <option value="">Cualquier material</option>
          {materials.data.filter((m) => m.activo).map((m) => <option key={m.id} value={m.id}>Que reciba {m.nombre}</option>)}
        </select>
      </div>

      {points.loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={MapPin} title="No hay puntos de acopio para mostrar" description="Pronto habrá lugares disponibles cerca de ti." />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <Card key={p.id} className="p-0 sm:p-0">
              <button type="button" onClick={() => setOpenId(openId === p.id ? null : p.id)} className="flex w-full items-center gap-4 p-5 text-left" aria-expanded={openId === p.id}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <PointTypeIcon tipo={p.tipo} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{p.nombre}</span>
                    <PointStatusBadge status={p.estado} />
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {pointTypes[p.tipo]?.label} · {p.direccion}
                    {p.barrio && `, ${p.barrio}`}
                  </span>
                </span>
                <ChevronDown className={`size-5 shrink-0 text-slate-400 transition ${openId === p.id ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openId === p.id && (
                <div className="border-t border-slate-100 p-5">
                  {p.estado === 'pausado' && (
                    <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Este punto está pausado temporalmente y no recibe materiales.</p>
                  )}
                  <PointProfile point={p} materials={materials.data} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
