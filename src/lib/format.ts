import type { Timestamp } from 'firebase/firestore'

const numberFormat = new Intl.NumberFormat('es-CO')
const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export function formatPoints(value: number) {
  return numberFormat.format(value)
}

export function formatDate(value: Timestamp | null | undefined) {
  return value ? dateFormat.format(value.toDate()) : '—'
}
