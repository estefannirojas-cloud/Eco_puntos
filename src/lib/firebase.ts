import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Datos de conexión con el proyecto de Firebase.
 * Se leen del archivo .env.local (que no se sube a GitHub).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** true cuando ya se copiaron los datos del proyecto en .env.local */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
)

// Si aún no hay datos, la app muestra una pantalla de configuración y no usa Firebase.
const app = initializeApp(
  isFirebaseConfigured ? firebaseConfig : { apiKey: 'sin-configurar', projectId: 'sin-configurar', appId: 'sin-configurar' },
)

export const auth = getAuth(app)
auth.languageCode = 'es'

export const db = getFirestore(app)
