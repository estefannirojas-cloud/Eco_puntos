import type { LucideIcon } from 'lucide-react'
import { Gift, Percent, ShoppingBasket, Sparkles } from 'lucide-react'
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import type { DocumentData, Query, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'
import type { Role, UserProfile } from './users'

// ============ Tipos ============

export type Category = 'descuento' | 'bono' | 'producto' | 'especial'

export type Reward = {
  id: string
  nombre: string
  descripcion: string
  empresa: string
  imagenUrl: string
  categoria: Category
  /** Puntos necesarios para canjearla. */
  puntos: number
  /** Unidades disponibles. */
  stock: number
  activa: boolean
  /** true si es un ejemplo demostrativo. */
  demo: boolean
  creadoEn: Timestamp | null
  actualizadoEn: Timestamp | null
}

export type RewardInput = Pick<Reward, 'nombre' | 'descripcion' | 'empresa' | 'imagenUrl' | 'categoria' | 'puntos' | 'stock' | 'activa'>

export type RedemptionStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'entregada'

export type Redemption = {
  /** Código único de redención (también es el id del documento). */
  codigo: string
  uid: string
  correo: string
  nombreCliente: string
  recompensaId: string
  recompensaNombre: string
  empresa: string
  puntos: number
  estado: RedemptionStatus
  nota?: string
  revisadoPor?: string
  creadoEn: Timestamp | null
  actualizadoEn: Timestamp | null
}

export type UserRow = UserProfile & { uid: string }

// ============ Textos y estilos ============

export const categories: Record<Category, { label: string; icon: LucideIcon; gradient: string }> = {
  descuento: { label: 'Descuentos en compras', icon: Percent, gradient: 'from-brand-500 to-brand-800' },
  bono: { label: 'Bonos de supermercado', icon: ShoppingBasket, gradient: 'from-lime-500 to-brand-700' },
  producto: { label: 'Productos promocionales', icon: Gift, gradient: 'from-teal-500 to-brand-800' },
  especial: { label: 'Beneficios especiales', icon: Sparkles, gradient: 'from-amber-400 to-brand-700' },
}

export const statusMeta: Record<RedemptionStatus, { label: string; className: string; description: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
    description: 'Tu solicitud fue recibida y está esperando revisión.',
  },
  aprobada: {
    label: 'Aprobada',
    className: 'bg-sky-50 text-sky-800 ring-sky-200',
    description: 'Tu solicitud fue aprobada. Presenta tu código para recibir el beneficio.',
  },
  entregada: {
    label: 'Entregada',
    className: 'bg-brand-50 text-brand-800 ring-brand-200',
    description: 'El beneficio ya fue entregado. ¡Gracias por reciclar!',
  },
  rechazada: {
    label: 'Rechazada',
    className: 'bg-red-50 text-red-700 ring-red-200',
    description: 'La solicitud fue rechazada y tus puntos fueron devueltos.',
  },
}

/** Cambios de estado permitidos (las reglas de seguridad exigen lo mismo). */
export const nextStatuses: Record<RedemptionStatus, RedemptionStatus[]> = {
  pendiente: ['aprobada', 'rechazada'],
  aprobada: ['entregada', 'rechazada'],
  entregada: [],
  rechazada: [],
}

export const POINTS_DISCLAIMER = 'Los EcoPuntos son beneficios promocionales y no representan dinero en efectivo.'

export function availability(r: Pick<Reward, 'activa' | 'stock'>) {
  if (!r.activa) return { available: false, label: 'No disponible' }
  if (r.stock <= 0) return { available: false, label: 'Agotado' }
  return { available: true, label: r.stock === 1 ? 'Última unidad' : `${r.stock} disponibles` }
}

/** Error con un mensaje listo para mostrar a la persona. */
export class FriendlyError extends Error {}

export function friendlyMessage(error: unknown) {
  if (error instanceof FriendlyError) return error.message
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code === 'permission-denied') return 'La operación no fue autorizada. Recarga la página e intenta de nuevo.'
  if (code === 'unavailable') return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}

// ============ Código único de redención ============

// Sin letras ni números que se confundan (O/0, I/1).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Genera un código como EP-7K3M-Q9XZ. */
export function generateRedemptionCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
  return `EP-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

// ============ Lecturas en tiempo real ============

type LiveState<T> = { data: T[]; loading: boolean; error: string | null }

export function useLiveQuery<T>(key: string | null, build: () => Query<DocumentData>, map: (d: QueryDocumentSnapshot) => T) {
  const [state, setState] = useState<LiveState<T> & { key: string | null }>({ data: [], loading: true, error: null, key })

  useEffect(() => {
    if (!key) return
    return onSnapshot(
      build(),
      (snap) => setState({ data: snap.docs.map(map), loading: false, error: null, key }),
      () => setState({ data: [], loading: false, error: 'No se pudo cargar la información. Recarga la página.', key }),
    )
    // Solo se vuelve a suscribir cuando cambia la "llave" de la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Mientras llegan los datos de una consulta nueva, se muestra "cargando".
  if (state.key !== key) return { data: [] as T[], loading: Boolean(key), error: null }
  return { data: state.data, loading: state.loading, error: state.error }
}

const toReward = (d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Reward
const toRedemption = (d: QueryDocumentSnapshot) => ({ codigo: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Redemption
const toUser = (d: QueryDocumentSnapshot) => ({ uid: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as UserRow

export function useRewards() {
  return useLiveQuery('recompensas', () => query(collection(db, 'recompensas'), orderBy('puntos', 'asc')), toReward)
}

export function useMyRedemptions(uid: string | undefined) {
  return useLiveQuery(
    uid ? `redenciones:${uid}` : null,
    () => query(collection(db, 'redenciones'), where('uid', '==', uid), orderBy('creadoEn', 'desc')),
    toRedemption,
  )
}

export function useAllRedemptions() {
  return useLiveQuery(
    'redenciones:todas',
    () => query(collection(db, 'redenciones'), orderBy('creadoEn', 'desc'), limit(500)),
    toRedemption,
  )
}

export function useUsers() {
  return useLiveQuery('usuarios', () => query(collection(db, 'usuarios'), orderBy('nombre', 'asc')), toUser)
}

// ============ Canje seguro ============

/**
 * Canjea una recompensa en UNA sola operación (transacción):
 * crea la solicitud con su código, descuenta los puntos y una unidad.
 * Si cualquier parte falla, no se hace nada. Si se repite con el mismo
 * código (doble clic, reintento), no se descuenta dos veces.
 */
export async function redeemReward(uid: string, rewardId: string, code: string) {
  const userRef = doc(db, 'usuarios', uid)
  const rewardRef = doc(db, 'recompensas', rewardId)
  const redemptionRef = doc(db, 'redenciones', code)

  return runTransaction(db, async (tx) => {
    const existing = await tx.get(redemptionRef)
    if (existing.exists()) {
      if (existing.data().uid === uid) return 'ya-registrada' as const
      throw new FriendlyError('No se pudo generar el código. Cierra la ventana e intenta de nuevo.')
    }

    const userSnap = await tx.get(userRef)
    const rewardSnap = await tx.get(rewardRef)
    if (!userSnap.exists()) throw new FriendlyError('No encontramos tu perfil.')
    if (!rewardSnap.exists()) throw new FriendlyError('Esta recompensa ya no existe.')

    const user = userSnap.data() as UserProfile
    const reward = rewardSnap.data() as Omit<Reward, 'id'>
    const balance = user.puntos ?? 0

    if (!availability(reward).available) throw new FriendlyError('Esta recompensa ya no está disponible.')
    if (balance < reward.puntos) {
      throw new FriendlyError(`Te faltan ${reward.puntos - balance} puntos para esta recompensa.`)
    }

    tx.set(redemptionRef, {
      uid,
      correo: user.correo,
      nombreCliente: user.nombre,
      recompensaId: rewardId,
      recompensaNombre: reward.nombre,
      empresa: reward.empresa,
      puntos: reward.puntos,
      estado: 'pendiente',
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    })
    tx.update(userRef, { puntos: balance - reward.puntos, ultimaRedencion: code })
    tx.update(rewardRef, { stock: reward.stock - 1, ultimaRedencion: code })
    return 'creada' as const
  })
}

// ============ Administración ============

/**
 * Cambia el estado de una solicitud. Si se rechaza, en la misma operación
 * se devuelven los puntos al cliente y la unidad a la recompensa.
 */
export async function changeRedemptionStatus(adminUid: string, code: string, next: RedemptionStatus, note: string) {
  const redemptionRef = doc(db, 'redenciones', code)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(redemptionRef)
    if (!snap.exists()) throw new FriendlyError('La solicitud no existe.')
    const redemption = snap.data() as Omit<Redemption, 'codigo'>

    if (!nextStatuses[redemption.estado].includes(next)) {
      throw new FriendlyError('Esta solicitud ya cambió de estado. Revisa la lista actualizada.')
    }

    if (next === 'rechazada') {
      const userRef = doc(db, 'usuarios', redemption.uid)
      const rewardRef = doc(db, 'recompensas', redemption.recompensaId)
      const userSnap = await tx.get(userRef)
      const rewardSnap = await tx.get(rewardRef)

      if (userSnap.exists()) {
        const newBalance = ((userSnap.data() as UserProfile).puntos ?? 0) + redemption.puntos
        tx.update(userRef, { puntos: newBalance })
        tx.set(doc(collection(db, 'usuarios', redemption.uid, 'movimientos')), {
          tipo: 'reembolso',
          puntos: redemption.puntos,
          motivo: `Devolución por canje rechazado ${code}`,
          saldoResultante: newBalance,
          autor: adminUid,
          creadoEn: serverTimestamp(),
        })
      }
      if (rewardSnap.exists()) {
        tx.update(rewardRef, { stock: (rewardSnap.data() as Reward).stock + 1, actualizadoEn: serverTimestamp() })
      }
    }

    tx.update(redemptionRef, {
      estado: next,
      nota: note.trim(),
      revisadoPor: adminUid,
      actualizadoEn: serverTimestamp(),
    })
  })
}

function cleanReward(input: RewardInput) {
  return {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion.trim(),
    empresa: input.empresa.trim(),
    imagenUrl: input.imagenUrl.trim(),
    categoria: input.categoria,
    puntos: Math.round(input.puntos),
    stock: Math.round(input.stock),
    activa: input.activa,
  }
}

export function createReward(input: RewardInput) {
  return addDoc(collection(db, 'recompensas'), {
    ...cleanReward(input),
    demo: false,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  })
}

export function updateReward(id: string, input: RewardInput) {
  return updateDoc(doc(db, 'recompensas', id), { ...cleanReward(input), actualizadoEn: serverTimestamp() })
}

export function setRewardActive(id: string, activa: boolean) {
  return updateDoc(doc(db, 'recompensas', id), { activa, actualizadoEn: serverTimestamp() })
}

/** Ejemplos demostrativos, claramente marcados como tales. */
const demoRewards: RewardInput[] = [
  {
    nombre: '15% de descuento en tu próxima compra',
    descripcion: 'Descuento aplicable en una compra de productos ecológicos en la tienda aliada.',
    empresa: 'Tienda Verde (empresa de ejemplo)',
    imagenUrl: '',
    categoria: 'descuento',
    puntos: 300,
    stock: 50,
    activa: true,
  },
  {
    nombre: 'Bono de supermercado',
    descripcion: 'Bono redimible en productos de la canasta familiar en el supermercado aliado.',
    empresa: 'Supermercado La Cosecha (empresa de ejemplo)',
    imagenUrl: '',
    categoria: 'bono',
    puntos: 800,
    stock: 20,
    activa: true,
  },
  {
    nombre: 'Botella reutilizable EcoPuntos',
    descripcion: 'Botella de acero inoxidable de 600 ml para reducir el uso de plásticos de un solo uso.',
    empresa: 'EcoPuntos',
    imagenUrl: '',
    categoria: 'producto',
    puntos: 450,
    stock: 30,
    activa: true,
  },
  {
    nombre: 'Taller de huerta urbana',
    descripcion: 'Cupo para un taller práctico de huerta en casa con un vivero aliado.',
    empresa: 'Vivero Raíces (empresa de ejemplo)',
    imagenUrl: '',
    categoria: 'especial',
    puntos: 600,
    stock: 10,
    activa: true,
  },
]

export async function loadDemoRewards() {
  const batch = writeBatch(db)
  for (const reward of demoRewards) {
    batch.set(doc(collection(db, 'recompensas')), {
      ...reward,
      demo: true,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    })
  }
  await batch.commit()
}

/** Suma o resta puntos a una persona y deja registro del motivo. */
export async function adjustPoints(adminUid: string, uid: string, delta: number, reason: string) {
  const userRef = doc(db, 'usuarios', uid)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef)
    if (!snap.exists()) throw new FriendlyError('La persona no existe.')
    const newBalance = ((snap.data() as UserProfile).puntos ?? 0) + delta
    if (newBalance < 0) throw new FriendlyError('El saldo no puede quedar en negativo.')
    tx.update(userRef, { puntos: newBalance })
    tx.set(doc(collection(db, 'usuarios', uid, 'movimientos')), {
      tipo: 'ajuste',
      puntos: delta,
      motivo: reason.trim(),
      saldoResultante: newBalance,
      autor: adminUid,
      creadoEn: serverTimestamp(),
    })
  })
}

export function setUserRole(uid: string, rol: Role) {
  return updateDoc(doc(db, 'usuarios', uid), { rol })
}
