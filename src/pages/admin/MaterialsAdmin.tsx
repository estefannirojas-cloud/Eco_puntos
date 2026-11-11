import { Coins, FlaskConical, History, LoaderCircle, Pencil, Plus, Power, Recycle, Scale, Trash2, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useActor } from '../../auth/context'
import { Modal } from '../../components/Modal'
import { MaterialIcon, Pill, Tabs } from '../../components/recycling'
import { Card, EmptyState, PageTitle, buttonDanger, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import {
  ROUNDING_RULE,
  deleteMaterial,
  loadInitialMaterials,
  materialCategories,
  saveMaterial,
  setMaterialActive,
  useMaterials,
  useTariffHistory,
} from '../../lib/recycling'
import type { Material, MaterialCategory, MaterialInput } from '../../lib/recycling'
import { friendlyMessage } from '../../lib/rewards'

const label = 'mb-1.5 block text-sm font-medium text-slate-700'

const emptyMaterial: MaterialInput = {
  nombre: '',
  categoria: 'plastico',
  descripcion: '',
  imagenUrl: '',
  activo: true,
  condiciones: '',
  observaciones: '',
  pesoMinimo: 1,
  puntosPorKg: 10,
}

// ---------------------------------------------------------------------
// Formulario de material
// ---------------------------------------------------------------------

function MaterialForm({ existing, onDone }: { existing: Material | null; onDone: () => void }) {
  const actor = useActor()
  const [form, setForm] = useState<MaterialInput>(() =>
    existing
      ? {
          nombre: existing.nombre,
          categoria: existing.categoria,
          descripcion: existing.descripcion,
          imagenUrl: existing.imagenUrl,
          activo: existing.activo,
          condiciones: existing.condiciones,
          observaciones: existing.observaciones,
          pesoMinimo: existing.pesoMinimo,
          puntosPorKg: existing.puntosPorKg,
        }
      : emptyMaterial,
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tariffChanged = existing !== null && form.puntosPorKg !== existing.puntosPorKg
  const set = <K extends keyof MaterialInput>(key: K, value: MaterialInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!actor) return
    if (!Number.isFinite(form.pesoMinimo) || form.pesoMinimo < 0) return setError('El peso mínimo debe ser 0 o más.')
    if (!Number.isFinite(form.puntosPorKg) || form.puntosPorKg < 0) return setError('Los puntos por kg deben ser 0 o más.')
    if (form.imagenUrl.trim() && !/^https:\/\//i.test(form.imagenUrl.trim())) return setError('La dirección de la imagen debe empezar por https://')
    if (tariffChanged && !reason.trim()) return setError('Escribe el motivo del cambio de tarifa; quedará en el historial.')
    setSaving(true)
    setError(null)
    try {
      await saveMaterial(actor, existing, form, reason)
      onDone()
    } catch (err) {
      setError(friendlyMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <MaterialIcon material={form} size="lg" />
        <p className="text-sm text-slate-500">Si no agregas una imagen, se muestra el icono de su categoría.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-nombre" className={label}>Nombre</label>
          <input id="m-nombre" required maxLength={60} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputClass} placeholder="Ej.: Plástico PET" />
        </div>
        <div>
          <label htmlFor="m-cat" className={label}>Categoría</label>
          <select id="m-cat" value={form.categoria} onChange={(e) => set('categoria', e.target.value as MaterialCategory)} className={inputClass}>
            {(Object.keys(materialCategories) as MaterialCategory[]).map((c) => (
              <option key={c} value={c}>{materialCategories[c].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="m-desc" className={label}>Descripción</label>
        <textarea id="m-desc" rows={2} maxLength={300} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={inputClass} placeholder="Qué objetos incluye este material." />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="m-unit" className={label}>Unidad de medida</label>
          <input id="m-unit" value="Kilogramos (kg)" disabled className={inputClass} />
        </div>
        <div>
          <label htmlFor="m-min" className={label}>Peso mínimo (kg)</label>
          <input id="m-min" type="number" required min={0} step={0.01} value={Number.isNaN(form.pesoMinimo) ? '' : form.pesoMinimo} onChange={(e) => set('pesoMinimo', e.target.valueAsNumber)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="m-pts" className={label}>Puntos por kg</label>
          <input id="m-pts" type="number" required min={0} step={0.01} value={Number.isNaN(form.puntosPorKg) ? '' : form.puntosPorKg} onChange={(e) => set('puntosPorKg', e.target.valueAsNumber)} className={inputClass} />
        </div>
      </div>
      {tariffChanged && (
        <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm text-amber-900">
            La tarifa cambia de <strong>{formatPoints(existing!.puntosPorKg)}</strong> a <strong>{formatPoints(form.puntosPorKg || 0)}</strong> puntos por kg.
            Solo aplica a entregas nuevas; las anteriores conservan su tarifa.
          </p>
          <label htmlFor="m-reason" className={`${label} mt-3`}>Motivo del cambio de tarifa</label>
          <input id="m-reason" required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} placeholder="Ej.: Ajuste por precio de mercado del material" />
        </div>
      )}
      <div>
        <label htmlFor="m-cond" className={label}>Condiciones de aceptación</label>
        <textarea id="m-cond" rows={2} maxLength={500} value={form.condiciones} onChange={(e) => set('condiciones', e.target.value)} className={inputClass} placeholder="Ej.: Limpio, seco y aplastado." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-obs" className={label}>Observaciones <span className="font-normal text-slate-400">(opcional)</span></label>
          <input id="m-obs" maxLength={300} value={form.observaciones} onChange={(e) => set('observaciones', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="m-img" className={label}>Imagen (dirección) <span className="font-normal text-slate-400">(opcional)</span></label>
          <input id="m-img" type="url" maxLength={500} value={form.imagenUrl} onChange={(e) => set('imagenUrl', e.target.value)} className={inputClass} placeholder="https://…" />
        </div>
      </div>
      <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
        <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} className="size-4 accent-brand-700" />
        <span>
          <span className="font-medium">Material activo</span>
          <span className="block text-slate-500">Si está inactivo, no se pueden registrar entregas de este material.</span>
        </span>
      </label>
      <p className="text-xs text-slate-500">{ROUNDING_RULE}</p>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {existing ? 'Guardar cambios' : 'Crear material'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------
// Lista de materiales
// ---------------------------------------------------------------------

function MaterialsList() {
  const actor = useActor()
  const { data: materials, loading, error } = useMaterials()
  const [category, setCategory] = useState<'todas' | MaterialCategory>('todas')
  const [editing, setEditing] = useState<{ material: Material | null } | null>(null)
  const [deleting, setDeleting] = useState<Material | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const visible = materials.filter((m) => category === 'todas' || m.categoria === category)

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key)
    setActionError(null)
    try {
      await action()
      return true
    } catch (err) {
      setActionError(friendlyMessage(err))
      return false
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['todas', ...Object.keys(materialCategories)] as ('todas' | MaterialCategory)[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                category === c ? 'bg-brand-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {c === 'todas' ? 'Todas' : materialCategories[c].label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!loading && materials.length === 0 && actor && (
            <button type="button" disabled={busy !== null} onClick={() => run('seed', () => loadInitialMaterials(actor))} className={buttonSecondary}>
              {busy === 'seed' ? <LoaderCircle className="size-4 animate-spin" /> : <FlaskConical className="size-4" aria-hidden="true" />}
              Cargar materiales iniciales
            </button>
          )}
          <button type="button" onClick={() => setEditing({ material: null })} className={buttonPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo material
          </button>
        </div>
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudieron cargar los materiales" description={error} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Recycle}
            title={materials.length === 0 ? 'Aún no hay materiales' : 'No hay materiales en esta categoría'}
            description={materials.length === 0 ? 'Crea el primero o carga los 8 materiales iniciales con tarifas de demostración (editables).' : 'Prueba con otra categoría.'}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <article key={m.id} className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${m.activo ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-80'}`}>
              <div className="flex items-start gap-3">
                <MaterialIcon material={m} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900">{m.nombre}</h3>
                  <p className="text-xs text-slate-500">{materialCategories[m.categoria]?.label}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill className={m.activo ? 'bg-brand-50 text-brand-800 ring-brand-200' : 'bg-slate-100 text-slate-600 ring-slate-300'}>
                    {m.activo ? 'Activo' : 'Inactivo'}
                  </Pill>
                  {m.demo && <Pill className="bg-amber-50 text-amber-800 ring-amber-200">Tarifa demo</Pill>}
                </div>
              </div>
              {m.descripcion && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{m.descripcion}</p>}
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="flex items-center gap-1 text-xs text-slate-500"><Scale className="size-3.5" aria-hidden="true" /> Peso mínimo</dt>
                  <dd className="mt-0.5 font-bold text-slate-900">{m.pesoMinimo.toLocaleString('es-CO')} kg</dd>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <dt className="flex items-center gap-1 text-xs text-brand-700"><Coins className="size-3.5" aria-hidden="true" /> Puntos por kg</dt>
                  <dd className="mt-0.5 font-bold text-brand-900">{formatPoints(m.puntosPorKg)}</dd>
                </div>
              </dl>
              {m.condiciones && <p className="mt-3 text-xs text-slate-600"><span className="font-semibold">Condiciones:</span> {m.condiciones}</p>}
              {m.observaciones && <p className="mt-1 text-xs text-slate-500">{m.observaciones}</p>}
              <div className="mt-auto flex gap-2 pt-4">
                <button type="button" onClick={() => setEditing({ material: m })} className={`${buttonSecondary} flex-1 px-3 py-2 text-sm`}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </button>
                <button
                  type="button"
                  disabled={busy !== null || !actor}
                  onClick={() => actor && run(m.id, () => setMaterialActive(actor, m, !m.activo))}
                  className={`${buttonSecondary} flex-1 px-3 py-2 text-sm`}
                >
                  {busy === m.id ? <LoaderCircle className="size-4 animate-spin" /> : <Power className="size-4" aria-hidden="true" />}
                  {m.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(m)}
                  disabled={m.tieneMovimientos}
                  title={m.tieneMovimientos ? 'Tiene entregas registradas: no se puede eliminar, solo desactivar.' : 'Eliminar material'}
                  className={`${buttonSecondary} px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
                  aria-label={`Eliminar ${m.nombre}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={editing !== null} title={editing?.material ? 'Editar material' : 'Nuevo material'} onClose={() => setEditing(null)} size="lg">
        {editing && <MaterialForm key={editing.material?.id ?? 'nuevo'} existing={editing.material} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal open={deleting !== null} title="Eliminar material" onClose={() => setDeleting(null)} locked={busy === 'delete'}>
        {deleting && (
          <div>
            <p className="text-slate-600">
              ¿Eliminar <strong>{deleting.nombre}</strong>? Como no tiene entregas registradas, se puede borrar. Esta acción no se puede deshacer.
              Su historial de tarifas se conserva.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancelar</button>
              <button
                type="button"
                disabled={busy === 'delete'}
                onClick={async () => {
                  if (await run('delete', () => deleteMaterial(deleting))) setDeleting(null)
                }}
                className={buttonDanger}
              >
                {busy === 'delete' && <LoaderCircle className="size-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// ---------------------------------------------------------------------
// Historial de tarifas
// ---------------------------------------------------------------------

function TariffHistory() {
  const { data, loading, error } = useTariffHistory()
  const [material, setMaterial] = useState('todos')
  const [author, setAuthor] = useState('todos')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const materialOptions = useMemo(() => [...new Map(data.map((d) => [d.materialId, d.materialNombre])).entries()], [data])
  const authorOptions = useMemo(() => [...new Map(data.map((d) => [d.autor, d.autorNombre || 'Sin nombre'])).entries()], [data])

  const visible = data.filter((d) => {
    const date = d.creadoEn?.toDate()
    if (material !== 'todos' && d.materialId !== material) return false
    if (author !== 'todos' && d.autor !== author) return false
    if (from && date && date < new Date(`${from}T00:00:00`)) return false
    if (to && date && date > new Date(`${to}T23:59:59`)) return false
    return true
  })

  return (
    <>
      <p className="mb-4 text-sm text-slate-500">
        Cada cambio de puntos por kg queda registrado aquí. Las entregas ya realizadas conservan la tarifa con la que se calcularon.
      </p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={material} onChange={(e) => setMaterial(e.target.value)} className={inputClass} aria-label="Filtrar por material">
          <option value="todos">Todos los materiales</option>
          {materialOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} aria-label="Filtrar por administrador">
          <option value="todos">Todos los administradores</option>
          {authorOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} aria-label="Desde" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} aria-label="Hasta" />
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudo cargar el historial" description={error} />
      ) : visible.length === 0 ? (
        <Card><EmptyState icon={History} title="Sin cambios de tarifa" description="No hay registros con estos filtros." /></Card>
      ) : (
        <Card className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha y hora</th>
                <th className="px-4 py-3 font-semibold">Material</th>
                <th className="px-4 py-3 text-right font-semibold">Tarifa anterior</th>
                <th className="px-4 py-3 text-right font-semibold">Nueva tarifa</th>
                <th className="px-4 py-3 font-semibold">Responsable</th>
                <th className="px-4 py-3 font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((d) => (
                <tr key={d.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(d.creadoEn)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.materialNombre}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{d.tarifaAnterior == null ? '—' : `${formatPoints(d.tarifaAnterior)} pts/kg`}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-800">{formatPoints(d.tarifaNueva)} pts/kg</td>
                  <td className="px-4 py-3 text-slate-600">{d.autorNombre}</td>
                  <td className="px-4 py-3 text-slate-600">{d.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

export function MaterialsAdmin() {
  const [tab, setTab] = useState<'materiales' | 'historial'>('materiales')
  return (
    <>
      <PageTitle title="Materiales reciclables" description="Materiales que acepta EcoPuntos, sus pesos mínimos y los puntos por kilogramo." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'materiales', label: 'Materiales' },
          { id: 'historial', label: 'Historial de tarifas' },
        ]}
      />
      {tab === 'materiales' ? <MaterialsList /> : <TariffHistory />}
    </>
  )
}
