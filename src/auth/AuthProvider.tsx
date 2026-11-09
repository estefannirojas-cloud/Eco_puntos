import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { auth, db } from '../lib/firebase'
import type { UserProfile } from '../lib/users'
import { AuthContext } from './context'
import type { AuthState } from './context'

/** Vigila la sesión de Firebase y el perfil de la persona en Firestore. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true, error: null })

  useEffect(() => {
    let stopProfile: (() => void) | undefined

    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.()
      stopProfile = undefined

      if (!user) {
        setState({ user: null, profile: null, loading: false, error: null })
        return
      }

      setState({ user, profile: null, loading: true, error: null })
      stopProfile = onSnapshot(
        doc(db, 'usuarios', user.uid),
        (snap) => {
          setState({
            user,
            profile: snap.exists() ? (snap.data() as UserProfile) : null,
            loading: false,
            error: null,
          })
        },
        () => {
          setState({ user, profile: null, loading: false, error: 'No se pudo leer tu perfil. Intenta recargar la página.' })
        },
      )
    })

    return () => {
      stopProfile?.()
      stopAuth()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
