import { Eye, EyeOff, FlaskConical, Gift, LoaderCircle, Pencil, Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { RewardCard } from '../../components/RewardCard'
import { RewardVisual } from '../../components/RewardVisual'
import { Card, EmptyState, PageTitle, buttonPrimary, buttonSecondary, inputClass } from '../../components/ui'
import {
  POINTS_DISCLAIMER,
  categories,
  createReward,
  friendlyMessage,
  loadDemoRewards,
  setRewardActive,
  updateReward,
  useRewards,
} from '../../lib/rewards'
import type { Category, Reward, RewardInput } from '../../lib/rewards'

const emptyForm: RewardInput = {
  nombre: '',
  descripcion: '',
  empresa: '',
  imagenUrl: '',
  categoria: 'descuento',
  puntos: 100,
  stock: 10,
  activa: true,
}

function RewardForm({ initial, editingId, onDone }: { initial: RewardInput; editingId: string | null; onDone: () => void }) {
  const [form, setForm] = useState<RewardInput>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof RewardInput>(key: K, value: RewardInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!Number.isInteger(form.puntos) || form.puntos < 1) return setError('Los puntos deben ser un número entero mayor que 0.')
    if (!Number.isInteger(form.stock) || form.stock < 0) return setError('La disponibilidad debe ser un número entero, 0 o más.')
    if (form.imagenUrl.trim() && !/^https:\/\//i.test(form.imagenUrl.trim())) {
      return setError('La dirección de la imagen debe empezar por https://')
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) await updateReward(editingId, form)
      else await createReward(form)
      onDone()
    } catch (err) {
      setError(friendlyMessage(err))
      setSaving(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-medium text-slate-700'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RewardVisual reward={form} className="h-36 rounded-xl" />

      <div>
        <label htmlFor="r-nombre" className={label}>Nombre del beneficio</label>
        <input id="r-nombre" required maxLength={80} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputClass} placeholder="Ej.: 10% de descuento en tu compra" />
      </div>
      <div>
        <label htmlFor="r-empresa" className={label}>Empresa que lo ofrece</label>
        <input id="r-empresa" required maxLength={80} value={form.empresa} onChange={(e) => set('empresa', e.target.value)} className={inputClass} placeholder="Ej.: Tienda Aliada S.A.S." />
      </div>
      <div>
        <label htmlFor="r-desc" className={label}>Descripción</label>
        <textarea id="r-desc" rows={3} maxLength={300} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={inputClass} placeholder="Qué recibe la persona y cómo lo usa." />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="r-cat" className={label}>Categoría</label>
          <select id="r-cat" value={form.categoria} onChange={(e) => set('categoria', e.target.value as Category)} className={inputClass}>
            {(Object.keys(categories) as Category[]).map((c) => (
              <option key={c} value={c}>{categories[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="r-pts" className={label}>Puntos necesarios</label>
          <input id="r-pts" type="number" required min={1} step={1} value={Number.isNaN(form.puntos) ? '' : form.puntos} onChange={(e) => set('puntos', e.target.valueAsNumber)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="r-stock" className={label}>Unidades disponibles</label>
          <input id="r-stock" type="number" required min={0} step={1} value={Number.isNaN(form.stock) ? '' : form.stock} onChange={(e) => set('stock', e.target.valueAsNumber)} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="r-img" className={label}>
          Dirección de la imagen <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input id="r-img" type="url" maxLength={500} value={form.imagenUrl} onChange={(e) => set('imagenUrl', e.target.value)} className={inputClass} placeholder="https://…" />
        <p className="mt-1 text-xs text-slate-500">Si la dejas vacía, se muestra una ilustración según la categoría.</p>
      </div>
      <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">
        <input type="checkbox" checked={form.activa} onChange={(e) => set('activa', e.target.checked)} className="size-4 accent-brand-700" />
        <span>
          <span className="font-medium">Visible en el catálogo</span>
          <span className="block text-slate-500">Si la desactivas, los clientes no podrán verla ni canjearla.</span>
        </span>
      </label>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={saving} className={buttonSecondary}>Cancelar</button>
        <button type="submit" disabled={saving} className={buttonPrimary}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {editingId ? 'Guardar cambios' : 'Crear recompensa'}
        </button>
      </div>
    </form>
  )
}

export function RewardsAdmin() {
  const { data: rewards, loading, error } = useRewards()
  const [editing, setEditing] = useState<{ id: string | null; initial: RewardInput } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const hasDemo = rewards.some((r) => r.demo)

  function openEdit(r: Reward) {
    const { nombre, descripcion, empresa, imagenUrl, categoria, puntos, stock, activa } = r
    setEditing({ id: r.id, initial: { nombre, descripcion, empresa, imagenUrl, categoria, puntos, stock, activa } })
  }

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key)
    setActionError(null)
    try {
      await action()
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
          <PageTitle title="Recompensas" description="Crea y administra el catálogo de beneficios de las empresas aliadas." />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {!loading && !hasDemo && (
            <button type="button" onClick={() => run('demo', loadDemoRewards)} disabled={busy !== null} className={buttonSecondary}>
              {busy === 'demo' ? <LoaderCircle className="size-4 animate-spin" /> : <FlaskConical className="size-4" aria-hidden="true" />}
              Cargar ejemplos demostrativos
            </button>
          )}
          <button type="button" onClick={() => setEditing({ id: null, initial: emptyForm })} className={buttonPrimary}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva recompensa
          </button>
        </div>
      </div>

      <p className="mb-6 text-sm text-slate-500">{POINTS_DISCLAIMER}</p>

      {actionError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />)}
        </div>
      ) : error ? (
        <EmptyState icon={TriangleAlert} title="No se pudo cargar el catálogo" description={error} />
      ) : rewards.length === 0 ? (
        <Card>
          <EmptyState
            icon={Gift}
            title="El catálogo está vacío"
            description='Crea la primera recompensa o carga los ejemplos demostrativos para ver cómo luce el catálogo.'
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rewards.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              footer={
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(r)} className={`${buttonSecondary} flex-1 px-3`}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => run(r.id, () => setRewardActive(r.id, !r.activa))}
                    disabled={busy !== null}
                    className={`${buttonSecondary} flex-1 px-3`}
                  >
                    {busy === r.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : r.activa ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                    {r.activa ? 'Ocultar' : 'Publicar'}
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing?.id ? 'Editar recompensa' : 'Nueva recompensa'}
        onClose={() => setEditing(null)}
        size="lg"
      >
        {editing && <RewardForm key={editing.id ?? 'nueva'} initial={editing.initial} editingId={editing.id} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  )
}
