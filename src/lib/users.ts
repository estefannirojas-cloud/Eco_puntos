import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export type Role = 'cliente' | 'gestor' | 'admin'

/** Perfil guardado en Firestore, en la colección "usuarios" (un documento por persona). */
export type UserProfile = {
  nombre: string
  correo: string
  celular: string
  ciudad: string
  rol: Role
  creadoEn: Timestamp | null
}

export type ProfileInput = { nombre: string; celular: string; ciudad: string }

export const roleLabels: Record<Role, string> = {
  cliente: 'Cliente',
  gestor: 'Gestor de reciclaje',
  admin: 'Administrador',
}

/** Pantalla principal de cada rol. */
export const roleHome: Record<Role, string> = {
  cliente: '/cliente',
  gestor: '/gestor',
  admin: '/admin',
}

/**
 * Crea el perfil de una persona nueva. Siempre empieza como "cliente";
 * solo un administrador puede cambiar el rol (lo exigen las reglas de seguridad).
 */
export function createClientProfile(uid: string, correo: string, data: ProfileInput) {
  return setDoc(doc(db, 'usuarios', uid), {
    nombre: data.nombre.trim(),
    correo,
    celular: data.celular.trim(),
    ciudad: data.ciudad.trim(),
    rol: 'cliente',
    creadoEn: serverTimestamp(),
  })
}
