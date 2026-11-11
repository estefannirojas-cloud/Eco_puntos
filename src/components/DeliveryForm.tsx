import { Calculator, Check, LoaderCircle, Mail, Search } from 'lucide-react'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { db } from '../lib/firebase'
import { formatPoints } from '../lib/format'
import { ROUNDING_RULE, calculatePoints, checkDelivery, newDeliveryId, roundKg } from '../lib/recycling'
import type { CollectionPoint, Material } from '../lib/recycling'
import { friendlyMessage } from '../lib/rewards'
import type { UserProfile } from '../lib/users'
import { MaterialIcon } from './recycling'
import { buttonPrimary, buttonSecondary, inputClass } from './ui'

const label = 'mb-1.5 block text-sm font-medium text-slate-700'

type FoundClient = { uid: string; nombre: string; correo: string }

type Props = {
  /** Puntos donde se puede registrar (ya filtrados para el rol). */
  points: CollectionPoint[]
  materials: Material[]
  /** "cliente": la persona registra su propia entrega (queda pendiente). "gestor": se registra y valida. */
  mode: 'cliente' | 'gestor'
  onSubmit: (args: { deliveryId: string; point: CollectionPoint; material: Material; kg: number; client: FoundClient | null }) => Promise<number | void>
}

/** Formulario de entrega: punto → material aceptado → peso, con validación y cálculo de puntos. */
export function DeliveryForm({ points, materials, mode, onSubmit }: Props) {
  const activePoints = points.filter((p) => p.estado === 'activo')
  const [pointId, setPointId] = useState(activePoints.length === 1 ? activePoints[0].id : '')
  const [materialId, setMaterialId] = useState('')
  const [kg, setKg] = useState<number>(NaN)
  // Un id por formulario: si se envía dos veces, no se duplica la entrega.
  const [deliveryId, setDeliveryId] = useState(newDeliveryId)
  const [email, setEmail] = useState('')
  const [client, setClient] = useState<FoundClient | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const point = activePoints.find((p) => p.id === pointId)
  const acceptedMaterials = point ? materials.filter((m) => m.activo && m.id in point.materiales) : []
  const material = acceptedMaterials.find((m) => m.id === materialId)
  const weight = Number.isFinite(kg) ? roundKg(kg) : NaN
  const problem = checkDelivery(point, material, weight)
  const estimate = material && Number.isFinite(weight) ? calculatePoints(weight, material.puntosPorKg) : 0

  async function findClient() {
    setError(null)
    setClient(null)
    const correo = email.trim().toLowerCase()
    if (!correo) return setError('Escribe el correo del cliente.')
    setSearching(true)
    try {
      const snap = await getDocs(query(collection(db, 'usuarios'), where('correo', '==', correo), limit(1)))
      if (snap.empty) setError('No hay ninguna persona registrada con ese correo.')
      else {
        const d = snap.docs[0]
        const data = d.data() as UserProfile
        setClient({ uid: d.id, nombre: data.nombre, correo: data.correo })
      }
    } catch (err) {
      setError(friendlyMessage(err))
    } finally {
      setSearching(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setDone(null)
    if (mode === 'gestor' && !client) return setError('Primero busca y confirma al cliente.')
    if (problem || !point || !material) return setError(problem ?? 'Revisa los datos.')
    setSaving(true)
    setError(null)
    try {
      const credited = await onSubmit({ deliveryId, point, material, kg: weight, client })
      setDone(
        mode === 'gestor'
          ? `Entrega registrada: ${weight.toLocaleString('es-CO')} kg de ${material.nombre}. Se acreditaron ${formatPoints(credited ?? estimate)} puntos a ${client?.nombre}.`
          : `Entrega registrada: ${weight.toLocaleString('es-CO')} kg de ${material.nombre}. Cuando el gestor la valide recibirás tus puntos.`,
      )
      // Formulario listo para la siguiente entrega (con un id nuevo).
      setDeliveryId(newDeliveryId())
      setKg(NaN)
      setMaterialId('')
      if (mode === 'gestor') {
        setClient(null)
        setEmail('')
      }
    } catch (err) {
      setError(friendlyMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (activePoints.length === 0) {
    return <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">No hay puntos de acopio activos disponibles en este momento.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'gestor' && (
        <div>
          <label htmlFor="d-client" className={label}>Correo del cliente</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="d-client"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setClient(null)
                }}
                className={`${inputClass} pl-9`}
                placeholder="cliente@correo.com"
              />
            </div>
            <button type="button" onClick={findClient} disabled={searching} className={`${buttonSecondary} px-3`}>
              {searching ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" aria-hidden="true" />}
              Buscar
            </button>
          </div>
          {client && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-800">
              <Check className="size-4" aria-hidden="true" /> {client.nombre}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="d-point" className={label}>Punto de acopio</label>
        <select
          id="d-point"
          value={pointId}
          onChange={(e) => {
            setPointId(e.target.value)
            setMaterialId('')
          }}
          className={inputClass}
        >
          <option value="">Selecciona un punto de acopio</option>
          {activePoints.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {p.direccion}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={label}>Material</span>
        {!point ? (
          <p className="text-sm text-slate-500">Primero selecciona el punto de acopio para ver qué materiales recibe.</p>
        ) : acceptedMaterials.length === 0 ? (
          <p className="text-sm text-amber-700">Este punto no tiene materiales habilitados en este momento.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Material">
            {acceptedMaterials.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={materialId === m.id}
                onClick={() => setMaterialId(m.id)}
                className={`flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition ${
                  materialId === m.id ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-slate-200 hover:ring-slate-300'
                }`}
              >
                <MaterialIcon material={m} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{m.nombre}</span>
                  <span className="text-xs text-slate-500">
                    mín. {m.pesoMinimo.toLocaleString('es-CO')} kg · {formatPoints(m.puntosPorKg)} pts/kg
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        {material && (
          <div className="mt-2 space-y-1 text-xs">
            {material.condiciones && <p className="text-slate-600">Condiciones: {material.condiciones}</p>}
            {point?.materiales[material.id]?.restriccion && <p className="text-amber-700">En este punto: {point.materiales[material.id].restriccion}</p>}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="d-kg" className={label}>Peso (kg)</label>
        <input
          id="d-kg"
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          value={Number.isNaN(kg) ? '' : kg}
          onChange={(e) => setKg(e.target.valueAsNumber)}
          className={inputClass}
          placeholder="Ej.: 2,5"
        />
      </div>

      {material && Number.isFinite(weight) && weight > 0 && (
        <div className={`flex items-start gap-3 rounded-xl p-4 text-sm ${problem ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-900'}`}>
          <Calculator className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {problem ? (
            <p>{problem}</p>
          ) : (
            <div>
              <p>
                {weight.toLocaleString('es-CO')} kg × {formatPoints(material.puntosPorKg)} pts/kg ={' '}
                <strong className="text-base">{formatPoints(estimate)} puntos</strong>
                {mode === 'cliente' && ' (estimado)'}
              </p>
              <p className="mt-0.5 text-xs opacity-80">
                {mode === 'cliente'
                  ? 'Los puntos se suman cuando el gestor valida la entrega, con la tarifa vigente en ese momento.'
                  : ROUNDING_RULE}
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {done && <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{done}</p>}

      <button type="submit" disabled={saving || Boolean(problem) || (mode === 'gestor' && !client)} className={`${buttonPrimary} w-full`}>
        {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {mode === 'gestor' ? 'Registrar y validar entrega' : 'Registrar entrega'}
      </button>
    </form>
  )
}
