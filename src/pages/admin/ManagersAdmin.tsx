import { Activity, Coins, LoaderCircle, MapPin, Package, Scale, Search, ShieldOff, TriangleAlert, UserPlus, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useActor } from '../../auth/context'
import { Modal } from '../../components/Modal'
import { PointStatusBadge, PointTypeIcon } from '../../components/recycling'
import { Card, EmptyState, PageTitle, buttonDanger, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import { assignManagerToPoints, useAllDeliveries, useMaterials, usePoints } from '../../lib/recycling'
import type { CollectionPoint, Delivery } from '../../lib/recycling'
import { friendlyMessage, setUserRole, useUsers } from '../../lib/rewards'
import type { UserRow } from '../../lib/rewards'

const kg = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 })

/** Casillas para elegir puntos de acopio. */
function PointPicker({ points, selected, onChange }: { points: CollectionPoint[]; selected: string[]; onChange: (ids: string[]) => void }) {
  if (points.length === 0) return <p className="text-sm text-amber-700">Aún no hay puntos de acopio. Créalos en la sección "Puntos de acopio".</p>
  return (
    <ul className="max-h-72 space-y-2 overflow-y-auto">
      {points.map((p) => {
        const checked = selected.includes(p.id)
        return (
          <li key={p.id}>
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ${checked ? 'bg-brand-50/60 ring-brand-200' : 'ring-slate-200'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))}
                className="size-4 accent-brand-700"
              />
              <PointTypeIcon tipo={p.tipo} className="size-4 text-brand-600" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{p.nombre}</span>
                <span className="block truncate text-xs text-slate-500">{p.direccion}</span>
              </span>
              <PointStatusBadge status={p.estado} />
            </label>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------
// Agregar un gestor (a partir de una persona ya registrada)
// ---------------------------------------------------------------------

function AddManager({ users, points, materialNames, onDone }: { users: UserRow[]; points: CollectionPoint[]; materialNames: Record<string, string>; onDone: () => void }) {
  const actor = useActor()
  const [search, setSearch] = useState('')
  const [chosen, setChosen] = useState<UserRow | null>(null)
  const [pointIds, setPointIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const term = search.trim().toLowerCase()
  const candidates = users.filter((u) => u.rol === 'cliente' && term.length >= 2 && `${u.nombre} ${u.correo}`.toLowerCase().includes(term)).slice(0, 8)

  async function confirm() {
    if (!actor || !chosen) return
    setSaving(true)
    setError(null)
    try {
      await setUserRole(chosen.uid, 'gestor')
      await assignManagerToPoints(actor, chosen.uid, pointIds, points, materialNames)
      onDone()
    } catch (err) {
      setError(friendlyMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        La persona primero debe <strong>registrarse en EcoPuntos</strong> con su correo. Luego búscala aquí para darle el rol de gestor.
      </p>

      {!chosen ? (
        <div>
          <label htmlFor="mg-search" className="mb-1.5 block text-sm font-medium text-slate-700">Buscar por nombre o correo</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="mg-search" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-9`} placeholder="Escribe al menos 2 letras" autoFocus />
          </div>
          {term.length >= 2 && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
              {candidates.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500">No hay clientes registrados que coincidan.</li>
              ) : (
                candidates.map((u) => (
                  <li key={u.uid}>
                    <button type="button" onClick={() => setChosen(u)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">{u.nombre}</span>
                        <span className="block truncate text-sm text-slate-500">{u.correo}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-brand-700">Elegir</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{chosen.nombre}</p>
              <p className="truncate text-sm text-slate-500">{chosen.correo}</p>
            </div>
            <button type="button" onClick={() => setChosen(null)} className="shrink-0 text-sm font-semibold text-brand-700">Cambiar</button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Puntos de acopio donde validará entregas</p>
            <PointPicker points={points} selected={pointIds} onChange={setPointIds} />
          </div>
        </>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button type="button" onClick={confirm} disabled={!chosen || saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Convertir en gestor
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Asignar puntos a un gestor existente
// ---------------------------------------------------------------------

function AssignPoints({ manager, points, materialNames, onDone }: { manager: UserRow; points: CollectionPoint[]; materialNames: Record<string, string>; onDone: () => void }) {
  const actor = useActor()
  const [selected, setSelected] = useState(points.filter((p) => p.gestores?.includes(manager.uid)).map((p) => p.id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!actor) return
    setSaving(true)
    setError(null)
    try {
      await assignManagerToPoints(actor, manager.uid, selected, points, materialNames)
      onDone()
    } catch (err) {
      setError(friendlyMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Marca los puntos donde <strong>{manager.nombre}</strong> puede registrar y validar entregas. El cambio queda en el historial de cada punto.
      </p>
      <PointPicker points={points} selected={selected} onChange={setSelected} />
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button type="button" onClick={save} disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Guardar asignación
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Actividad de un gestor
// ---------------------------------------------------------------------

function ManagerActivity({ deliveries }: { deliveries: Delivery[] }) {
  if (deliveries.length === 0) return <EmptyState icon={Activity} title="Sin actividad" description="Este gestor aún no ha validado ni rechazado entregas." />
  return (
    <ul className="divide-y divide-slate-100">
      {deliveries.slice(0, 50).map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">
              {d.estado === 'validada' ? 'Validó' : 'Rechazó'}: {d.materialNombre} de {d.clienteNombre}
            </p>
            <p className="truncate text-xs text-slate-500">{d.puntoNombre} · {formatDate(d.validadoEn)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tabular-nums text-slate-700">{kg(d.pesoAceptado ?? d.pesoDeclarado)} kg</p>
            {d.estado === 'validada' ? (
              <p className="text-xs font-semibold text-brand-700">+{formatPoints(d.puntos ?? 0)} pts</p>
            ) : (
              <p className="text-xs text-red-600">Rechazada</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------

export function ManagersAdmin() {
  const actor = useActor()
  const users = useUsers()
  const points = usePoints()
  const materials = useMaterials()
  const deliveries = useAllDeliveries()
  const [adding, setAdding] = useState(false)
  const [assigning, setAssigning] = useState<UserRow | null>(null)
  const [viewing, setViewing] = useState<UserRow | null>(null)
  const [revoking, setRevoking] = useState<UserRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const materialNames = useMemo(() => Object.fromEntries(materials.data.map((m) => [m.id, m.nombre])), [materials.data])
  const managers = users.data.filter((u) => u.rol === 'gestor')
  const reviewedBy = (uid: string) => deliveries.data.filter((d) => d.validadoPor === uid && d.estado !== 'pendiente')

  async function revoke() {
    if (!actor || !revoking) return
    setBusy(true)
    setError(null)
    try {
      // Primero se retira de los puntos (queda en su historial) y luego vuelve a ser cliente.
      await assignManagerToPoints(actor, revoking.uid, [], points.data, materialNames)
      await setUserRole(revoking.uid, 'cliente')
      setRevoking(null)
    } catch (err) {
      setError(friendlyMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const loading = users.loading || points.loading

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="[&>div]:mb-0">
          <PageTitle title="Gestores" description="Responsables de recibir, pesar y validar el material en los puntos de acopio." />
        </div>
        <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}>
          <UserPlus className="size-4" aria-hidden="true" /> Agregar gestor
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : users.error ? (
        <EmptyState icon={TriangleAlert} title="No se pudieron cargar los gestores" description={users.error} />
      ) : managers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Warehouse}
            title="Aún no hay gestores"
            description='Pide a la persona que se registre en EcoPuntos y luego usa "Agregar gestor" para darle el rol y asignarle sus puntos de acopio.'
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {managers.map((m) => {
            const assigned = points.data.filter((p) => p.gestores?.includes(m.uid))
            const activity = reviewedBy(m.uid)
            const validated = activity.filter((d) => d.estado === 'validada')
            const last = activity[0]
            return (
              <article key={m.uid} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold uppercase text-brand-800">
                    {m.nombre.trim().charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{m.nombre}</h3>
                    <p className="truncate text-sm text-slate-500">{m.correo}{m.celular && ` · ${m.celular}`}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin className="size-3.5" aria-hidden="true" /> Puntos asignados
                  </p>
                  {assigned.length === 0 ? (
                    <p className="text-sm text-amber-700">Sin puntos asignados: no puede validar entregas todavía.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200">
                          {p.nombre}
                          {p.estado !== 'activo' && <span className="text-amber-700">({p.estado})</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <dt className="flex items-center justify-center gap-1 text-xs text-slate-500"><Package className="size-3.5" aria-hidden="true" /> Validadas</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">{deliveries.loading ? '—' : validated.length}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <dt className="flex items-center justify-center gap-1 text-xs text-slate-500"><Scale className="size-3.5" aria-hidden="true" /> Kilos</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">{deliveries.loading ? '—' : kg(validated.reduce((s, d) => s + (d.pesoAceptado ?? 0), 0))}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <dt className="flex items-center justify-center gap-1 text-xs text-slate-500"><Coins className="size-3.5" aria-hidden="true" /> Puntos</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">{deliveries.loading ? '—' : formatPoints(validated.reduce((s, d) => s + (d.puntos ?? 0), 0))}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-slate-500">Última actividad: {last ? formatDate(last.validadoEn) : 'ninguna'}</p>

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button type="button" onClick={() => setAssigning(m)} className={`${buttonSecondary} flex-1 px-3 py-2 text-sm`}>
                    <MapPin className="size-4" aria-hidden="true" /> Asignar puntos
                  </button>
                  <button type="button" onClick={() => setViewing(m)} className={`${buttonSecondary} flex-1 px-3 py-2 text-sm`}>
                    <Activity className="size-4" aria-hidden="true" /> Actividad
                  </button>
                  <button type="button" onClick={() => setRevoking(m)} className={`${buttonSecondary} px-3 py-2 text-sm`} title="Retirar permisos de gestor">
                    <ShieldOff className="size-4" aria-hidden="true" />
                    <span className="sr-only">Retirar permisos</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={adding} title="Agregar gestor" onClose={() => setAdding(false)} size="lg">
        {adding && <AddManager users={users.data} points={points.data} materialNames={materialNames} onDone={() => setAdding(false)} />}
      </Modal>

      <Modal open={assigning !== null} title="Asignar puntos de acopio" onClose={() => setAssigning(null)} size="lg">
        {assigning && <AssignPoints key={assigning.uid} manager={assigning} points={points.data} materialNames={materialNames} onDone={() => setAssigning(null)} />}
      </Modal>

      <Modal open={viewing !== null} title={viewing ? `Actividad de ${viewing.nombre}` : ''} onClose={() => setViewing(null)} size="lg">
        {viewing && <ManagerActivity deliveries={reviewedBy(viewing.uid)} />}
      </Modal>

      <Modal open={revoking !== null} title="Retirar permisos de gestor" onClose={() => setRevoking(null)} locked={busy}>
        {revoking && (
          <div>
            <p className="text-slate-600">
              <strong>{revoking.nombre}</strong> dejará de ser gestor: se retirará de todos sus puntos de acopio y volverá a ser cliente.
              Las entregas que ya validó se conservan en el historial.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRevoking(null)} disabled={busy} className={buttonSecondary}>Cancelar</button>
              <button type="button" onClick={revoke} disabled={busy} className={buttonDanger}>
                {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                Retirar permisos
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
