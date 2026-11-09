import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'
import type { UserProfile } from '../lib/users'

export type AuthState = {
  /** Persona con sesión iniciada (o null si no ha ingresado). */
  user: User | null
  /** Su perfil en Firestore (null si aún no lo ha completado). */
  profile: UserProfile | null
  /** true mientras se averigua si hay sesión y se lee el perfil. */
  loading: boolean
  /** Mensaje si no se pudo leer el perfil. */
  error: string | null
}

export const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true, error: null })

export function useAuth() {
  return useContext(AuthContext)
}
