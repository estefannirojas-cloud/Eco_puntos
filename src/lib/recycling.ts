import type { LucideIcon } from 'lucide-react'
import {
  Building,
  Building2,
  CircleHelp,
  FileText,
  GlassWater,
  GraduationCap,
  Landmark,
  Milk,
  Package,
  School,
  ShoppingBag,
  ShoppingCart,
  Store,
  Wrench,
} from 'lucide-react'
import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import type { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { FriendlyError, useLiveQuery } from './rewards'
import type { UserProfile } from './users'

// =====================================================================
// Materiales
// =====================================================================

export type MaterialCategory = 'plastico' | 'papel_carton' | 'vidrio' | 'metales' | 'otros'

export const materialCategories: Record<MaterialCategory, { label: string; icon: LucideIcon; tone: string }> = {
  plastico: { label: 'Plásticos', icon: Milk, tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  papel_carton: { label: 'Papel y cartón', icon: FileText, tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  vidrio: { label: 'Vidrio', icon: GlassWater, tone: 'bg-teal-50 text-teal-700 ring-teal-200' },
  metales: { label: 'Metales', icon: Wrench, tone: 'bg-slate-100 text-slate-700 ring-slate-300' },
  otros: { label: 'Otros', icon: Package, tone: 'bg-brand-50 text-brand-700 ring-brand-200' },
}

export type Material = {
  id: string
  nombre: string
  categoria: MaterialCategory
  descripcion: string
  imagenUrl: string
  unidad: 'kg'
  activo: boolean
  /** Condiciones para recibirlo (limpio, seco, sin tapa…). */
  condiciones: string
  observaciones: string
  /** Peso mínimo de recepción, en kg. */
  pesoMinimo: number
  /** Puntos que recibe la persona por cada kg aceptado. */
  puntosPorKg: number
  /** true cuando ya tiene entregas registradas (entonces no se puede eliminar). */
  tieneMovimientos: boolean
  demo: boolean
  creadoEn: Timestamp | null
  actualizadoEn: Timestamp | null
}

export type MaterialInput = Pick<
  Material,
  'nombre' | 'categoria' | 'descripcion' | 'imagenUrl' | 'activo' | 'condiciones' | 'observaciones' | 'pesoMinimo' | 'puntosPorKg'
>

export type TariffChange = {
  id: string
  materialId: string
  materialNombre: string
  tarifaAnterior: number | null
  tarifaNueva: number
  motivo: string
  autor: string
  autorNombre: string
  creadoEn: Timestamp | null
}

// =====================================================================
// Puntos de acopio
// =====================================================================

export type PointType =
  | 'universidad'
  | 'colegio'
  | 'conjunto'
  | 'centro_comercial'
  | 'empresa'
  | 'supermercado'
  | 'institucion_publica'
  | 'otro'

export const pointTypes: Record<PointType, { label: string; icon: LucideIcon }> = {
  universidad: { label: 'Universidad', icon: GraduationCap },
  colegio: { label: 'Colegio', icon: School },
  conjunto: { label: 'Conjunto residencial', icon: Building },
  centro_comercial: { label: 'Centro comercial', icon: ShoppingBag },
  empresa: { label: 'Empresa', icon: Building2 },
  supermercado: { label: 'Supermercado', icon: ShoppingCart },
  institucion_publica: { label: 'Institución pública', icon: Landmark },
  otro: { label: 'Otro establecimiento', icon: Store },
}

export type PointStatus = 'activo' | 'pausado' | 'inactivo'

export const pointStatusMeta: Record<PointStatus, { label: string; description: string; className: string }> = {
  activo: { label: 'Activo', description: 'Disponible para recibir materiales.', className: 'bg-brand-50 text-brand-800 ring-brand-200' },
  pausado: { label: 'Pausado', description: 'Temporalmente no recibe materiales.', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  inactivo: { label: 'Inactivo', description: 'Fuera de operación.', className: 'bg-slate-100 text-slate-600 ring-slate-300' },
}

export const weekDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const
export type WeekDay = (typeof weekDays)[number]

export const weekDayLabels: Record<WeekDay, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export type DaySchedule = { abierto: boolean; apertura: string; cierre: string }
export type Schedule = Record<WeekDay, DaySchedule>

export function defaultSchedule(): Schedule {
  const open = (abierto: boolean, apertura = '08:00', cierre = '17:00') => ({ abierto, apertura, cierre })
  return {
    lunes: open(true),
    martes: open(true),
    miercoles: open(true),
    jueves: open(true),
    viernes: open(true),
    sabado: open(true, '08:00', '12:00'),
    domingo: open(false),
  }
}

/** Material aceptado en un punto, con su restricción particular (opcional). */
export type PointMaterial = { restriccion: string }

export type CollectionPoint = {
  id: string
  nombre: string
  tipo: PointType
  direccion: string
  barrio: string
  municipio: string
  responsable: string
  telefono: string
  correo: string
  descripcion: string
  fotoUrl: string
  lat: number | null
  lng: number | null
  estado: PointStatus
  horario: Schedule
  observacionesHorario: string
  /** Materiales aceptados: id del material → restricción particular. */
  materiales: Record<string, PointMaterial>
  /** Gestores (uid) que pueden validar entregas en este punto. */
  gestores: string[]
  creadoEn: Timestamp | null
  actualizadoEn: Timestamp | null
}

export type PointInput = Omit<CollectionPoint, 'id' | 'creadoEn' | 'actualizadoEn'>

export type PointChange = {
  id: string
  accion: string
  detalle: string
  autor: string
  autorNombre: string
  creadoEn: Timestamp | null
}

// =====================================================================
// Entregas
// =====================================================================

export type DeliveryStatus = 'pendiente' | 'validada' | 'rechazada'

export const deliveryStatusMeta: Record<DeliveryStatus, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente de validar', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  validada: { label: 'Validada', className: 'bg-brand-50 text-brand-800 ring-brand-200' },
  rechazada: { label: 'Rechazada', className: 'bg-red-50 text-red-700 ring-red-200' },
}

export type Delivery = {
  id: string
  uid: string
  clienteNombre: string
  clienteCorreo: string
  puntoId: string
  puntoNombre: string
  puntoTipo: PointType
  materialId: string
  materialNombre: string
  materialCategoria: MaterialCategory
  /** Peso informado al registrar (kg). */
  pesoDeclarado: number
  estado: DeliveryStatus
  origen: 'cliente' | 'gestor'
  creadoEn: Timestamp | null
  // Datos de la validación (se guardan para conservar la tarifa histórica)
  pesoAceptado?: number
  tarifaAplicada?: number
  pesoMinimoAplicado?: number
  puntos?: number
  validadoPor?: string
  validadorNombre?: string
  validadoEn?: Timestamp | null
  motivoRechazo?: string
}

// =====================================================================
// Cálculos
// =====================================================================

/** Redondea un peso a 2 decimales (centésimas de kg). */
export function roundKg(value: number) {
  return Math.round(value * 100) / 100
}

/**
 * Puntos = kg aceptados × puntos por kg, redondeado HACIA ABAJO a un número entero.
 * (El pequeño margen evita errores de decimales; las reglas de seguridad usan la misma fórmula.)
 */
export function calculatePoints(kg: number, pointsPerKg: number) {
  return Math.floor(kg * pointsPerKg + 0.000001)
}

export const ROUNDING_RULE =
  'Puntos = kilogramos aceptados × puntos por kg, redondeado hacia abajo al número entero. El peso se registra con hasta 2 decimales.'

/** Fecha de referencia de una entrega para estadísticas: cuando se validó (o se creó). */
export function deliveryDate(d: Pick<Delivery, 'validadoEn' | 'creadoEn'>) {
  return (d.validadoEn ?? d.creadoEn)?.toDate() ?? null
}

// =====================================================================
// Lecturas en tiempo real
// =====================================================================

const withId = <T,>(d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as T

const toMaterial = (d: QueryDocumentSnapshot) => withId<Material>(d)
const toPoint = (d: QueryDocumentSnapshot) => withId<CollectionPoint>(d)
const toTariff = (d: QueryDocumentSnapshot) => withId<TariffChange>(d)
const toPointChange = (d: QueryDocumentSnapshot) => withId<PointChange>(d)
const toDelivery = (d: QueryDocumentSnapshot) => withId<Delivery>(d)

export function useMaterials() {
  return useLiveQuery('materiales', () => query(collection(db, 'materiales'), orderBy('nombre', 'asc')), toMaterial)
}

export function useTariffHistory() {
  return useLiveQuery(
    'historialTarifas',
    () => query(collection(db, 'historialTarifas'), orderBy('creadoEn', 'desc'), limit(1000)),
    toTariff,
  )
}

export function usePoints() {
  return useLiveQuery('puntosAcopio', () => query(collection(db, 'puntosAcopio'), orderBy('nombre', 'asc')), toPoint)
}

export function usePointChanges(pointId: string | null) {
  return useLiveQuery(
    pointId ? `cambios:${pointId}` : null,
    () => query(collection(db, 'puntosAcopio', pointId ?? '_', 'cambios'), orderBy('creadoEn', 'desc'), limit(200)),
    toPointChange,
  )
}

export function useMyDeliveries(uid: string | undefined) {
  return useLiveQuery(
    uid ? `entregas:${uid}` : null,
    () => query(collection(db, 'entregas'), where('uid', '==', uid), orderBy('creadoEn', 'desc')),
    toDelivery,
  )
}

/** Entregas para el personal (gestores y administradores). */
export function useAllDeliveries(enabled = true) {
  return useLiveQuery(
    enabled ? 'entregas:todas' : null,
    () => query(collection(db, 'entregas'), orderBy('creadoEn', 'desc'), limit(3000)),
    toDelivery,
  )
}

// =====================================================================
// Administración de materiales
// =====================================================================

type Actor = { uid: string; nombre: string }

function cleanMaterial(input: MaterialInput) {
  return {
    nombre: input.nombre.trim(),
    categoria: input.categoria,
    descripcion: input.descripcion.trim(),
    imagenUrl: input.imagenUrl.trim(),
    unidad: 'kg' as const,
    activo: input.activo,
    condiciones: input.condiciones.trim(),
    observaciones: input.observaciones.trim(),
    pesoMinimo: roundKg(input.pesoMinimo),
    puntosPorKg: Math.round(input.puntosPorKg * 100) / 100,
  }
}

/**
 * Crea o modifica un material. Si cambia la tarifa (puntos por kg), en la MISMA
 * operación queda el registro en el historial de tarifas con su motivo.
 */
export async function saveMaterial(actor: Actor, existing: Material | null, input: MaterialInput, reason: string) {
  const data = cleanMaterial(input)
  const batch = writeBatch(db)
  const historyRef = doc(collection(db, 'historialTarifas'))

  if (!existing) {
    const ref = doc(collection(db, 'materiales'))
    batch.set(ref, {
      ...data,
      tieneMovimientos: false,
      demo: false,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
      actualizadoPor: actor.uid,
      ultimoCambioTarifa: historyRef.id,
    })
    batch.set(historyRef, {
      materialId: ref.id,
      materialNombre: data.nombre,
      tarifaAnterior: null,
      tarifaNueva: data.puntosPorKg,
      motivo: reason.trim() || 'Tarifa inicial al crear el material',
      autor: actor.uid,
      autorNombre: actor.nombre,
      creadoEn: serverTimestamp(),
    })
  } else {
    const ref = doc(db, 'materiales', existing.id)
    const tariffChanged = data.puntosPorKg !== existing.puntosPorKg
    if (tariffChanged && !reason.trim()) throw new FriendlyError('Escribe el motivo del cambio de tarifa.')
    batch.update(ref, {
      ...data,
      actualizadoEn: serverTimestamp(),
      actualizadoPor: actor.uid,
      ...(tariffChanged ? { ultimoCambioTarifa: historyRef.id } : {}),
    })
    if (tariffChanged) {
      batch.set(historyRef, {
        materialId: existing.id,
        materialNombre: data.nombre,
        tarifaAnterior: existing.puntosPorKg,
        tarifaNueva: data.puntosPorKg,
        motivo: reason.trim(),
        autor: actor.uid,
        autorNombre: actor.nombre,
        creadoEn: serverTimestamp(),
      })
    }
  }
  await batch.commit()
}

export async function setMaterialActive(actor: Actor, material: Material, activo: boolean) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'materiales', material.id), { activo, actualizadoEn: serverTimestamp(), actualizadoPor: actor.uid })
  await batch.commit()
}

export async function deleteMaterial(material: Material) {
  if (material.tieneMovimientos) {
    throw new FriendlyError('Este material ya tiene entregas registradas. Desactívalo para conservar su historial.')
  }
  const batch = writeBatch(db)
  batch.delete(doc(db, 'materiales', material.id))
  await batch.commit()
}

/** Materiales iniciales con tarifas de demostración (editables). */
const initialMaterials: MaterialInput[] = [
  { nombre: 'Plástico PET', categoria: 'plastico', descripcion: 'Botellas transparentes de bebidas (código 1).', imagenUrl: '', activo: true, condiciones: 'Limpio, seco y aplastado. Sin restos de líquido.', observaciones: '', pesoMinimo: 1, puntosPorKg: 10 },
  { nombre: 'Plástico HDPE', categoria: 'plastico', descripcion: 'Envases rígidos de detergentes, champú y leche (código 2).', imagenUrl: '', activo: true, condiciones: 'Limpio y seco, sin restos del producto.', observaciones: '', pesoMinimo: 1, puntosPorKg: 15 },
  { nombre: 'Plástico PP', categoria: 'plastico', descripcion: 'Tapas, recipientes de comida y vasos rígidos (código 5).', imagenUrl: '', activo: true, condiciones: 'Limpio y seco.', observaciones: '', pesoMinimo: 1, puntosPorKg: 8 },
  { nombre: 'Cartón', categoria: 'papel_carton', descripcion: 'Cajas y empaques de cartón corrugado.', imagenUrl: '', activo: true, condiciones: 'Seco, sin grasa, desarmado y doblado.', observaciones: '', pesoMinimo: 2, puntosPorKg: 5 },
  { nombre: 'Papel', categoria: 'papel_carton', descripcion: 'Hojas de oficina, cuadernos, periódicos y revistas.', imagenUrl: '', activo: true, condiciones: 'Seco y sin arrugar. Sin papel higiénico ni servilletas.', observaciones: '', pesoMinimo: 1, puntosPorKg: 6 },
  { nombre: 'Vidrio', categoria: 'vidrio', descripcion: 'Botellas y frascos de vidrio.', imagenUrl: '', activo: true, condiciones: 'Limpio, sin tapa y sin romper.', observaciones: 'No se recibe vidrio plano ni de ventanas.', pesoMinimo: 2, puntosPorKg: 4 },
  { nombre: 'Aluminio', categoria: 'metales', descripcion: 'Latas de bebidas y bandejas de aluminio.', imagenUrl: '', activo: true, condiciones: 'Limpio y aplastado.', observaciones: '', pesoMinimo: 0.5, puntosPorKg: 25 },
  { nombre: 'Metales y chatarra aprovechable', categoria: 'metales', descripcion: 'Latas de acero, piezas metálicas pequeñas y chatarra.', imagenUrl: '', activo: true, condiciones: 'Sin elementos cortantes expuestos ni residuos peligrosos.', observaciones: '', pesoMinimo: 1, puntosPorKg: 20 },
]

export async function loadInitialMaterials(actor: Actor) {
  const batch = writeBatch(db)
  for (const m of initialMaterials) {
    const ref = doc(collection(db, 'materiales'))
    const historyRef = doc(collection(db, 'historialTarifas'))
    batch.set(ref, {
      ...cleanMaterial(m),
      tieneMovimientos: false,
      demo: true,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
      actualizadoPor: actor.uid,
      ultimoCambioTarifa: historyRef.id,
    })
    batch.set(historyRef, {
      materialId: ref.id,
      materialNombre: m.nombre,
      tarifaAnterior: null,
      tarifaNueva: m.puntosPorKg,
      motivo: 'Tarifa inicial de demostración',
      autor: actor.uid,
      autorNombre: actor.nombre,
      creadoEn: serverTimestamp(),
    })
  }
  await batch.commit()
}

// =====================================================================
// Administración de puntos de acopio
// =====================================================================

function cleanPoint(input: PointInput): PointInput {
  const materiales: Record<string, PointMaterial> = {}
  for (const [id, m] of Object.entries(input.materiales)) materiales[id] = { restriccion: m.restriccion.trim() }
  return {
    nombre: input.nombre.trim(),
    tipo: input.tipo,
    direccion: input.direccion.trim(),
    barrio: input.barrio.trim(),
    municipio: input.municipio.trim(),
    responsable: input.responsable.trim(),
    telefono: input.telefono.trim(),
    correo: input.correo.trim(),
    descripcion: input.descripcion.trim(),
    fotoUrl: input.fotoUrl.trim(),
    lat: input.lat,
    lng: input.lng,
    estado: input.estado,
    horario: input.horario,
    observacionesHorario: input.observacionesHorario.trim(),
    materiales,
    gestores: input.gestores,
  }
}

const fieldLabels: Partial<Record<keyof PointInput, string>> = {
  nombre: 'nombre',
  tipo: 'tipo',
  direccion: 'dirección',
  barrio: 'barrio',
  municipio: 'municipio',
  responsable: 'responsable',
  telefono: 'teléfono',
  correo: 'correo',
  descripcion: 'descripción',
  fotoUrl: 'fotografía',
  lat: 'ubicación',
  lng: 'ubicación',
  estado: 'estado',
  horario: 'horario',
  observacionesHorario: 'observaciones del horario',
  materiales: 'materiales aceptados',
  gestores: 'gestores asignados',
}

/** Describe en palabras qué cambió, para el historial del punto. */
function describeChanges(before: CollectionPoint, after: PointInput, materialNames: Record<string, string>) {
  const changes = new Set<string>()
  for (const key of Object.keys(fieldLabels) as (keyof PointInput)[]) {
    if (key === 'materiales' || key === 'estado') continue
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changes.add(`Se actualizó ${fieldLabels[key]}`)
  }
  if (before.estado !== after.estado) {
    changes.add(`Estado: ${pointStatusMeta[before.estado].label} → ${pointStatusMeta[after.estado].label}`)
  }
  const name = (id: string) => materialNames[id] ?? 'material eliminado'
  const added = Object.keys(after.materiales).filter((id) => !(id in before.materiales))
  const removed = Object.keys(before.materiales).filter((id) => !(id in after.materiales))
  const restricted = Object.keys(after.materiales).filter(
    (id) => id in before.materiales && before.materiales[id].restriccion !== after.materiales[id].restriccion,
  )
  if (added.length) changes.add(`Materiales agregados: ${added.map(name).join(', ')}`)
  if (removed.length) changes.add(`Materiales retirados: ${removed.map(name).join(', ')}`)
  if (restricted.length) changes.add(`Restricciones actualizadas: ${restricted.map(name).join(', ')}`)
  return [...changes]
}

export async function savePoint(actor: Actor, existing: CollectionPoint | null, input: PointInput, materialNames: Record<string, string>) {
  const data = cleanPoint(input)
  const batch = writeBatch(db)
  const pointRef = existing ? doc(db, 'puntosAcopio', existing.id) : doc(collection(db, 'puntosAcopio'))
  const changeRef = doc(collection(db, 'puntosAcopio', pointRef.id, 'cambios'))

  let accion = 'Creación'
  let detalle = `Se creó el punto de acopio "${data.nombre}" con estado ${pointStatusMeta[data.estado].label.toLowerCase()}.`
  if (existing) {
    const changes = describeChanges(existing, data, materialNames)
    if (changes.length === 0) return 'sin-cambios' as const
    accion = existing.estado !== data.estado && changes.length === 1 ? 'Cambio de estado' : 'Modificación'
    detalle = changes.join('. ') + '.'
  }

  const payload = { ...data, actualizadoEn: serverTimestamp(), actualizadoPor: actor.uid, ultimoCambio: changeRef.id }
  if (existing) batch.update(pointRef, payload)
  else batch.set(pointRef, { ...payload, creadoEn: serverTimestamp() })

  batch.set(changeRef, { accion, detalle: detalle.slice(0, 2000), autor: actor.uid, autorNombre: actor.nombre, creadoEn: serverTimestamp() })
  await batch.commit()
  return 'guardado' as const
}

export function setPointStatus(actor: Actor, point: CollectionPoint, estado: PointStatus, materialNames: Record<string, string>) {
  const { id: _id, creadoEn: _c, actualizadoEn: _a, ...rest } = point
  return savePoint(actor, point, { ...rest, estado }, materialNames)
}

// =====================================================================
// Entregas
// =====================================================================

/** Genera el id único de una entrega (uno por formulario, para evitar duplicados). */
export function newDeliveryId() {
  return doc(collection(db, 'entregas')).id
}

/** Verifica que el material se pueda entregar en el punto con ese peso. */
export function checkDelivery(point: CollectionPoint | undefined, material: Material | undefined, kg: number) {
  if (!point) return 'Selecciona un punto de acopio.'
  if (point.estado !== 'activo') return 'Este punto de acopio no está recibiendo materiales en este momento.'
  if (!material) return 'Selecciona un material.'
  if (!material.activo) return 'Este material no se está recibiendo actualmente.'
  if (!(material.id in point.materiales)) return 'Este punto de acopio no recibe ese material.'
  if (!Number.isFinite(kg) || kg <= 0) return 'Escribe el peso en kilogramos.'
  if (kg > 10000) return 'El peso es demasiado alto. Revisa la cantidad.'
  if (kg < material.pesoMinimo) {
    return `El peso mínimo para ${material.nombre} es ${material.pesoMinimo.toLocaleString('es-CO')} kg.`
  }
  return null
}

function baseDelivery(client: { uid: string; nombre: string; correo: string }, point: CollectionPoint, material: Material, kg: number) {
  return {
    uid: client.uid,
    clienteNombre: client.nombre,
    clienteCorreo: client.correo,
    puntoId: point.id,
    puntoNombre: point.nombre,
    puntoTipo: point.tipo,
    materialId: material.id,
    materialNombre: material.nombre,
    materialCategoria: material.categoria,
    pesoDeclarado: roundKg(kg),
  }
}

/** El cliente pre-registra una entrega: queda pendiente y sin puntos hasta que el gestor la valide. */
export async function createClientDelivery(
  deliveryId: string,
  client: { uid: string; nombre: string; correo: string },
  point: CollectionPoint,
  material: Material,
  kg: number,
) {
  const problem = checkDelivery(point, material, roundKg(kg))
  if (problem) throw new FriendlyError(problem)

  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'entregas', deliveryId)
    const existing = await tx.get(ref)
    if (existing.exists()) return // ya se registró (doble clic): no se duplica
    tx.set(ref, { ...baseDelivery(client, point, material, kg), estado: 'pendiente', origen: 'cliente', creadoEn: serverTimestamp() })
    if (!material.tieneMovimientos) tx.update(doc(db, 'materiales', material.id), { tieneMovimientos: true })
  })
}

/** Lee el material y el punto VIGENTES dentro de la transacción y valida todo. */
async function readCurrent(tx: Parameters<Parameters<typeof runTransaction>[1]>[0], pointId: string, materialId: string) {
  const pointSnap = await tx.get(doc(db, 'puntosAcopio', pointId))
  const materialSnap = await tx.get(doc(db, 'materiales', materialId))
  if (!pointSnap.exists()) throw new FriendlyError('El punto de acopio ya no existe.')
  if (!materialSnap.exists()) throw new FriendlyError('El material ya no existe.')
  return {
    point: { id: pointSnap.id, ...pointSnap.data() } as CollectionPoint,
    material: { id: materialSnap.id, ...materialSnap.data() } as Material,
  }
}

/**
 * El gestor registra y valida una entrega en el punto. En UNA sola operación:
 * guarda la entrega con la tarifa vigente y suma los puntos al cliente.
 */
export async function registerValidatedDelivery(
  deliveryId: string,
  staff: Actor,
  clientUid: string,
  pointId: string,
  materialId: string,
  kg: number,
) {
  const weight = roundKg(kg)
  return runTransaction(db, async (tx) => {
    const deliveryRef = doc(db, 'entregas', deliveryId)
    const existing = await tx.get(deliveryRef)
    if (existing.exists()) return existing.data().puntos as number // ya registrada: no se acredita dos veces

    const { point, material } = await readCurrent(tx, pointId, materialId)
    const clientRef = doc(db, 'usuarios', clientUid)
    const clientSnap = await tx.get(clientRef)
    if (!clientSnap.exists()) throw new FriendlyError('No encontramos a la persona.')
    const client = clientSnap.data() as UserProfile

    const problem = checkDelivery(point, material, weight)
    if (problem) throw new FriendlyError(problem)

    const puntos = calculatePoints(weight, material.puntosPorKg)
    tx.set(deliveryRef, {
      ...baseDelivery({ uid: clientUid, nombre: client.nombre, correo: client.correo }, point, material, weight),
      estado: 'validada',
      origen: 'gestor',
      creadoEn: serverTimestamp(),
      pesoAceptado: weight,
      tarifaAplicada: material.puntosPorKg,
      pesoMinimoAplicado: material.pesoMinimo,
      puntos,
      validadoPor: staff.uid,
      validadorNombre: staff.nombre,
      validadoEn: serverTimestamp(),
    })
    tx.update(clientRef, { puntos: (client.puntos ?? 0) + puntos, ultimaEntrega: deliveryId })
    if (!material.tieneMovimientos) tx.update(doc(db, 'materiales', material.id), { tieneMovimientos: true })
    return puntos
  })
}

/** El gestor valida una entrega pendiente (puede corregir el peso) y se acreditan los puntos. */
export async function validateDelivery(staff: Actor, deliveryId: string, acceptedKg: number) {
  const weight = roundKg(acceptedKg)
  return runTransaction(db, async (tx) => {
    const deliveryRef = doc(db, 'entregas', deliveryId)
    const snap = await tx.get(deliveryRef)
    if (!snap.exists()) throw new FriendlyError('La entrega no existe.')
    const delivery = snap.data() as Delivery
    if (delivery.estado !== 'pendiente') throw new FriendlyError('Esta entrega ya fue revisada.')

    const { point, material } = await readCurrent(tx, delivery.puntoId, delivery.materialId)
    const clientRef = doc(db, 'usuarios', delivery.uid)
    const clientSnap = await tx.get(clientRef)
    if (!clientSnap.exists()) throw new FriendlyError('La persona ya no existe.')

    const problem = checkDelivery(point, material, weight)
    if (problem) throw new FriendlyError(problem)

    const puntos = calculatePoints(weight, material.puntosPorKg)
    tx.update(deliveryRef, {
      estado: 'validada',
      pesoAceptado: weight,
      tarifaAplicada: material.puntosPorKg,
      pesoMinimoAplicado: material.pesoMinimo,
      puntos,
      validadoPor: staff.uid,
      validadorNombre: staff.nombre,
      validadoEn: serverTimestamp(),
    })
    tx.update(clientRef, { puntos: ((clientSnap.data() as UserProfile).puntos ?? 0) + puntos, ultimaEntrega: deliveryId })
    return puntos
  })
}

export async function rejectDelivery(staff: Actor, deliveryId: string, reason: string) {
  if (!reason.trim()) throw new FriendlyError('Escribe el motivo del rechazo.')
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'entregas', deliveryId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new FriendlyError('La entrega no existe.')
    if ((snap.data() as Delivery).estado !== 'pendiente') throw new FriendlyError('Esta entrega ya fue revisada.')
    tx.update(ref, {
      estado: 'rechazada',
      motivoRechazo: reason.trim(),
      validadoPor: staff.uid,
      validadorNombre: staff.nombre,
      validadoEn: serverTimestamp(),
    })
  })
}

/** Iconos genéricos para mostrar cuando un dato no aplica. */
export const UnknownIcon = CircleHelp

// =====================================================================
// Mapas
// =====================================================================

/** Mapa embebido de OpenStreetMap (gratuito, sin clave) centrado en el punto. */
export function mapEmbedUrl(lat: number, lng: number) {
  const d = 0.004
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`
}

/** Enlace para abrir el punto en Google Maps (por coordenadas o por dirección). */
export function mapsLink(point: Pick<CollectionPoint, 'lat' | 'lng' | 'direccion' | 'municipio'>) {
  if (point.lat != null && point.lng != null) return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.direccion}, ${point.municipio}`)}`
}
