import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth'
import { auth } from './firebase'
import { createClientProfile } from './users'
import type { ProfileInput } from './users'

/** Mínimo de caracteres exigido para las contraseñas nuevas. */
export const MIN_PASSWORD_LENGTH = 8

/** Revisa que la contraseña sea razonable antes de enviarla. */
export function passwordProblem(password: string, confirmation?: string) {
  if (password.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) return 'La contraseña debe tener letras y números.'
  if (confirmation !== undefined && password !== confirmation) return 'Las contraseñas no coinciden.'
  return null
}

export function signInWithPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
}

/** Crea la cuenta y, de inmediato, su perfil de cliente en Firestore. */
export async function registerWithPassword(email: string, password: string, profile: ProfileInput) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
  // Si guardar el perfil falla (por ejemplo, sin internet), la app pedirá completarlo al entrar.
  await createClientProfile(user.uid, user.email ?? email.trim().toLowerCase(), profile)
  return user
}

/** Envía un correo para crear una contraseña nueva. */
export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

/** Cambia la contraseña de la persona con sesión iniciada. */
export function changePassword(newPassword: string) {
  if (!auth.currentUser) throw new Error('Sin sesión')
  return updatePassword(auth.currentUser, newPassword)
}
