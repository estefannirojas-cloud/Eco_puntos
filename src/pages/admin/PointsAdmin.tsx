import { Eye, History, LoaderCircle, MapPin, Pause, Pencil, Play, Plus, Power, Search, TriangleAlert, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useActor } from '../../auth/context'
import { Modal } from '../../components/Modal'
import { MaterialIcon, PointProfile, PointStatusBadge, PointTypeIcon, Tabs } from '../../components/recycling'
import { Card, EmptyState, PageTitle, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import {
  defaultSchedule,
  mapEmbedUrl,
  pointStatusMeta,
  pointTypes,
  savePoint,
  setPointStatus,
  useMaterials,
  usePointChanges,
  usePoints,
  weekDayLabels,
  weekDays,
} from '../../lib/recycling'
import type { CollectionPoint, Material, PointInput, PointStatus, PointType } from '../../lib/recycling'
import { friendlyMessage, useUsers } from '../../lib/rewards'

const label = 'mb-1.5 block text-sm font-medium text-slate-700'

function emptyPoint(): PointInput {
  return {
    nombre: '',
    tipo: 'universidad',
    direccion: '',
    barrio: '',
    municipio: 'Popayán, Cauca',
    responsable: '',
    telefono: '',
    correo: '',
    descripcion: '',
    fotoUrl: '',
    lat: null,
    lng: null,
    estado: 'activo',
    horario: defaultSchedule(),
    observacionesHorario: '',
    materiales: {},
    gestores: [],
  }
}

function toInput(p: CollectionPoint): PointInput {
  const { id: _id, creadoEn: _c, actualizadoEn: _a, ...rest } = p
  return { ...emptyPoint(), ...rest, horario: { ...defaultSchedule(), ...rest.horario } }
}

// ---------------------------------------------------------------------
// Formulario del punto de acopio
// ---------------------------------------------------------------------

function PointForm({ existing, materials, onDone }: { existing: CollectionPoint | null; materials: Material[]; onDone: () => void }) {
  const actor = useActor()
  const users = useUsers()
  const [form, setForm] = useState<PointInput>(() => (existing ? toInput(existing) : emptyPoint()))
  const [latText, setLatText] = useState(existing?.lat?.toString() ?? '')
  const [lngText, setLngText] = useState(existing?.lng?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const managers = users.data.filter((u) => u.rol === 'gestor')
  const materialNames = useMemo(() => Object.fromEntries(materials.map((m) => [m.id, m.nombre])), [materials])
  const set = <K extends keyof PointInput>(key: K, value: PointInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  function toggleMaterial(id: string) {
    setForm((f) => {
      const next = { ...f.materiales }
      if (id in next) delete next[id]
      else next[id] = { restriccion: '' }
      return { ...f, materiales: next }
    })
  }

  function parseCoordinate(text: string, limit: number) {
    if (!text.trim()) return null
    const n = Number(text.replace(',', '.'))
    return Number.isFinite(n) && Math.abs(n) <= limit ? n : NaN
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!actor) return
    const lat = parseCoordinate(latText, 90)
    const lng = parseCoordinate(lngText, 180)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return setError('Revisa las coordenadas: latitud entre -90 y 90, longitud entre -180 y 180.')
    if ((lat === null) !== (lng === null)) return setError('Escribe la latitud y la longitud, o deja ambas vacías.')
    for (const day of weekDays) {
      const h = form.horario[day]
      if (h.abierto && h.apertura >= h.cierre) return setError(`En ${weekDayLabels[day]} la hora de cierre debe ser después de la apertura.`)
    }
    if (form.fotoUrl.trim() && !/^https:\/\//i.test(form.fotoUrl.trim())) return setError('La dirección de la fotografía debe empezar por https://')
    setSaving(true)
    setError(null)
    try {
      const result = await savePoint(actor, existing, { ...form, lat, lng }, materialNames)
      if (result === 'sin-cambios') setError('No hay cambios para guardar.')
      else onDone()
    } catch (err) {
      setError(friendlyMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const lat = parseCoordinate(latText, 90)
  const lng = parseCoordinate(lngText, 180)
  const hasMap = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Datos generales */}
      <section className="space-y-4">
        <h3 className="font-semibold text-slate-900">Datos del establecimiento</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-nombre" className={label}>Nombre del establecimiento</label>
            <input id="p-nombre" required maxLength={100} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-tipo" className={label}>Tipo de establecimiento</label>
            <select id="p-tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value as PointType)} className={inputClass}>
              {(Object.keys(pointTypes) as PointType[]).map((t) => <option key={t} value={t}>{pointTypes[t].label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-dir" className={label}>Dirección</label>
            <input id="p-dir" required maxLength={150} value={form.direccion} onChange={(e) => set('direccion', e.target.value)} className={inputClass} placeholder="Ej.: Calle 5 # 10-20" />
          </div>
          <div>
            <label htmlFor="p-barrio" className={label}>Barrio o sector</label>
            <input id="p-barrio" maxLength={80} value={form.barrio} onChange={(e) => set('barrio', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-mun" className={label}>Municipio</label>
            <input id="p-mun" required maxLength={80} value={form.municipio} onChange={(e) => set('municipio', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-resp" className={label}>Persona responsable</label>
            <input id="p-resp" maxLength={100} value={form.responsable} onChange={(e) => set('responsable', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-tel" className={label}>Teléfono de contacto</label>
            <input id="p-tel" type="tel" maxLength={30} value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-mail" className={label}>Correo electrónico</label>
            <input id="p-mail" type="email" maxLength={120} value={form.correo} onChange={(e) => set('correo', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="p-desc" className={label}>Descripción</label>
          <textarea id="p-desc" rows={2} maxLength={500} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={inputClass} placeholder="Dónde está exactamente el punto dentro del lugar, cómo llegar…" />
        </div>
        <div>
          <label htmlFor="p-foto" className={label}>Fotografía (dirección) <span className="font-normal text-slate-400">(opcional)</span></label>
          <input id="p-foto" type="url" maxLength={500} value={form.fotoUrl} onChange={(e) => set('fotoUrl', e.target.value)} className={inputClass} placeholder="https://…" />
        </div>
        <div>
          <label htmlFor="p-estado" className={label}>Estado</label>
          <select id="p-estado" value={form.estado} onChange={(e) => set('estado', e.target.value as PointStatus)} className={inputClass}>
            {(Object.keys(pointStatusMeta) as PointStatus[]).map((s) => (
              <option key={s} value={s}>{pointStatusMeta[s].label} — {pointStatusMeta[s].description}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Ubicación */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Ubicación en el mapa</h3>
        <p className="text-sm text-slate-500">
          En Google Maps, haz clic derecho sobre el lugar y copia los dos números que aparecen (latitud, longitud). Popayán está cerca de 2.44, -76.61.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-lat" className={label}>Latitud</label>
            <input id="p-lat" inputMode="decimal" value={latText} onChange={(e) => setLatText(e.target.value)} className={inputClass} placeholder="2.4448" />
          </div>
          <div>
            <label htmlFor="p-lng" className={label}>Longitud</label>
            <input id="p-lng" inputMode="decimal" value={lngText} onChange={(e) => setLngText(e.target.value)} className={inputClass} placeholder="-76.6147" />
          </div>
        </div>
        {hasMap && <iframe title="Vista previa del mapa" src={mapEmbedUrl(lat, lng)} className="h-48 w-full rounded-xl ring-1 ring-slate-200" loading="lazy" />}
      </section>

      {/* Horario */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Horario de atención</h3>
        <div className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
          {weekDays.map((day) => {
            const h = form.horario[day]
            const update = (patch: Partial<typeof h>) => set('horario', { ...form.horario, [day]: { ...h, ...patch } })
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <label className="flex w-32 items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={h.abierto} onChange={(e) => update({ abierto: e.target.checked })} className="size-4 accent-brand-700" />
                  {weekDayLabels[day]}
                </label>
                {h.abierto ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" value={h.apertura} onChange={(e) => update({ apertura: e.target.value })} className={`${inputClass} w-auto py-1.5`} aria-label={`Apertura ${weekDayLabels[day]}`} />
                    <span className="text-slate-400">a</span>
                    <input type="time" value={h.cierre} onChange={(e) => update({ cierre: e.target.value })} className={`${inputClass} w-auto py-1.5`} aria-label={`Cierre ${weekDayLabels[day]}`} />
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Cerrado</span>
                )}
              </div>
            )
          })}
        </div>
        <div>
          <label htmlFor="p-hobs" className={label}>Observaciones especiales del horario</label>
          <input id="p-hobs" maxLength={300} value={form.observacionesHorario} onChange={(e) => set('observacionesHorario', e.target.value)} className={inputClass} placeholder="Ej.: Cerrado en vacaciones de diciembre" />
        </div>
      </section>

      {/* Materiales aceptados */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Materiales aceptados</h3>
        {materials.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Primero registra materiales en la sección "Materiales".</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((m) => {
              const selected = m.id in form.materiales
              return (
                <li key={m.id} className={`rounded-xl p-3 ring-1 ${selected ? 'bg-brand-50/60 ring-brand-200' : 'ring-slate-200'}`}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={selected} onChange={() => toggleMaterial(m.id)} className="size-4 accent-brand-700" />
                    <MaterialIcon material={m} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">
                        {m.nombre} {!m.activo && <span className="font-normal text-slate-500">(inactivo)</span>}
                      </span>
                      <span className="text-xs text-slate-500">
                        Mínimo {m.pesoMinimo.toLocaleString('es-CO')} kg · {formatPoints(m.puntosPorKg)} puntos por kg (tarifa vigente)
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <input
                      maxLength={200}
                      value={form.materiales[m.id].restriccion}
                      onChange={(e) => set('materiales', { ...form.materiales, [m.id]: { restriccion: e.target.value } })}
                      className={`${inputClass} mt-2 py-2 text-sm`}
                      placeholder="Restricción particular en este punto (opcional). Ej.: solo botellas de 2 litros o menos"
                      aria-label={`Restricción para ${m.nombre}`}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Gestores */}
      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Gestores que validan entregas aquí</h3>
        {managers.length === 0 ? (
          <p className="text-sm text-slate-500">No hay personas con rol de gestor. Asigna el rol en la sección "Usuarios".</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {managers.map((u) => (
              <label key={u.uid} className="flex items-center gap-3 rounded-lg p-2.5 text-sm ring-1 ring-slate-200">
                <input
                  type="checkbox"
                  checked={form.gestores.includes(u.uid)}
                  onChange={(e) => set('gestores', e.target.checked ? [...form.gestores, u.uid] : form.gestores.filter((g) => g !== u.uid))}
                  className="size-4 accent-brand-700"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-800">{u.nombre}</span>
                  <span className="block truncate text-xs text-slate-500">{u.correo}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
        <button type="button" onClick={onDone} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {existing ? 'Guardar cambios' : 'Crear punto de acopio'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------
// Detalle: perfil + historial de modificaciones
// ---------------------------------------------------------------------

function PointDetail({ point, materials }: { point: CollectionPoint; materials: Material[] }) {
  const [tab, setTab] = useState<'perfil' | 'historial'>('perfil')
  const changes = usePointChanges(point.id)
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'perfil', label: 'Perfil' }, { id: 'historial', label: 'Historial de modificaciones' }]} />
      {tab === 'perfil' ? (
        <>
          <PointProfile point={point} materials={materials} />
          <p className="mt-6 text-xs text-slate-400">Creado el {formatDate(point.creadoEn)} · Última modificación {formatDate(point.actualizadoEn)}</p>
        </>
      ) : changes.loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : changes.data.length === 0 ? (
        <EmptyState icon={History} title="Sin modificaciones registradas" description="Los cambios aparecerán aquí." />
      ) : (
        <ol className="space-y-3">
          {changes.data.map((c) => (
            <li key={c.id} className="rounded-xl p-4 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{c.accion}</span>
                <span className="text-xs text-slate-500">{formatDate(c.creadoEn)} · {c.autorNombre}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{c.detalle}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

// ---------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------

export function PointsAdmin() {
  const actor = useActor()
  const { data: points, loading, error } = usePoints()
  const { data: materials } = useMaterials()
  const [status, setStatus] = useState<'todos' | PointStatus>('todos')
  const [type, setType] = useState<'todos' | PointType>('todos')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ point: CollectionPoint | null } | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const materialNames = useMemo(() => Object.fromEntries(materials.map((m) => [m.id, m.nombre])), [materials])
  const viewing = points.find((p) => p.id === viewingId) ?? null
  const term = search.trim().toLowerCase()
  const visible = points.filter(
    (p) =>
      (status === 'todos' || p.estado === status) &&
      (type === 'todos' || p.tipo === type) &&
      (!term || `${p.nombre} ${p.direccion} ${p.barrio}`.toLowerCase().includes(term)),
  )

  async function changeStatus(p: CollectionPoint, estado: PointStatus) {
    if (!actor) return
    setBusy(p.id)
    setActionError(null)
    try {
      await setPointStatus(actor, p, estado, materialNames)
    } catch (err) {
      setActionError(friendlyMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="[&>div]:mb-0">
          <PageTitle title="Puntos de acopio" description="Lugares donde la ciudadanía entrega sus materiales reciclables." />
        </div>
        <button type="button" onClick={() => setEditing({ point: null })} className={buttonPrimary}>
          <Plus className="size-4" aria-hidden="true" /> Nuevo punto de acopio
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o dirección" className={`${inputClass} pl-9`} aria-label="Buscar puntos" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as 'todos' | PointType)} className={inputClass} aria-label="Filtrar por tipo">
          <option value="todos">Todos los tipos</option>
          {(Object.keys(pointTypes) as PointType[]).map((t) => <option key={t} value={t}>{pointTypes[t].label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'todos' | PointStatus)} className={inputClass} aria-label="Filtrar por estado">
          <option value="todos">Todos los estados</option>
          {(Object.keys(pointStatusMeta) as PointStatus[]).map((s) => <option key={s} value={s}>{pointStatusMeta[s].label}</option>)}
        </select>
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudieron cargar los puntos" description={error} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Warehouse}
            title={points.length === 0 ? 'Aún no hay puntos de acopio' : 'Ningún punto coincide con los filtros'}
            description={points.length === 0 ? 'Crea el primero: universidad, colegio, conjunto residencial, empresa…' : 'Prueba con otros filtros.'}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const accepted = materials.filter((m) => m.id in (p.materiales ?? {}))
            return (
              <article key={p.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <PointTypeIcon tipo={p.tipo} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{p.nombre}</h3>
                    <p className="text-xs text-slate-500">{pointTypes[p.tipo]?.label}</p>
                  </div>
                  <PointStatusBadge status={p.estado} />
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{p.direccion}{p.barrio && `, ${p.barrio}`} · {p.municipio}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {accepted.length === 0 ? (
                    <span className="text-xs text-amber-700">Sin materiales habilitados</span>
                  ) : (
                    accepted.slice(0, 5).map((m) => (
                      <span key={m.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{m.nombre}</span>
                    ))
                  )}
                  {accepted.length > 5 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">+{accepted.length - 5}</span>}
                </div>
                <p className="mt-2 text-xs text-slate-500">{p.gestores?.length ? `${p.gestores.length} gestor(es) asignado(s)` : 'Sin gestores asignados'}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button type="button" onClick={() => setViewingId(p.id)} className={`${buttonSecondary} flex-1 px-3 py-2 text-sm`}>
                    <Eye className="size-4" aria-hidden="true" /> Ver
                  </button>
                  <button type="button" onClick={() => setEditing({ point: p })} className={`${buttonSecondary} flex-1 px-3 py-2 text-sm`}>
                    <Pencil className="size-4" aria-hidden="true" /> Editar
                  </button>
                  {p.estado === 'activo' ? (
                    <button type="button" disabled={busy !== null} onClick={() => changeStatus(p, 'pausado')} className={`${buttonSecondary} px-3 py-2 text-sm`} title="Pausar temporalmente">
                      {busy === p.id ? <LoaderCircle className="size-4 animate-spin" /> : <Pause className="size-4" aria-hidden="true" />}
                      <span className="sr-only">Pausar</span>
                    </button>
                  ) : (
                    <button type="button" disabled={busy !== null} onClick={() => changeStatus(p, 'activo')} className={`${buttonSecondary} px-3 py-2 text-sm`} title="Activar">
                      {busy === p.id ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" aria-hidden="true" />}
                      <span className="sr-only">Activar</span>
                    </button>
                  )}
                  {p.estado !== 'inactivo' && (
                    <button type="button" disabled={busy !== null} onClick={() => changeStatus(p, 'inactivo')} className={`${buttonSecondary} px-3 py-2 text-sm`} title="Marcar fuera de operación">
                      <Power className="size-4" aria-hidden="true" />
                      <span className="sr-only">Inactivar</span>
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={editing !== null} title={editing?.point ? 'Editar punto de acopio' : 'Nuevo punto de acopio'} onClose={() => setEditing(null)} size="lg">
        {editing && <PointForm key={editing.point?.id ?? 'nuevo'} existing={editing.point} materials={materials} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal open={viewing !== null} title={viewing?.nombre ?? ''} onClose={() => setViewingId(null)} size="lg">
        {viewing && <PointDetail key={viewing.id} point={viewing} materials={materials} />}
      </Modal>
    </>
  )
}
