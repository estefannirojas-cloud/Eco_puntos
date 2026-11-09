import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth'
import { auth } from './firebase'
import type { ProfileInput } from './users'

// Datos que se recuerdan en este navegador mientras la persona abre el enlace del correo.
const EMAIL_KEY = 'ecopuntos:correoParaIngresar'
const PENDING_PROFILE_KEY = 'ecopuntos:registroPendiente'

function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Navegación privada u otro bloqueo: seguimos sin recordar el dato.
  }
}

/** Envía el enlace de acceso al correo. */
export async function sendMagicLink(email: string, pendingProfile?: ProfileInput) {
  const correo = email.trim().toLowerCase()
  await sendSignInLinkToEmail(auth, correo, {
    url: `${window.location.origin}/verificar`,
    handleCodeInApp: true,
  })
  safeSet(EMAIL_KEY, correo)
  safeSet(PENDING_PROFILE_KEY, pendingProfile ? JSON.stringify(pendingProfile) : null)
}

export function isMagicLink(url: string) {
  return isSignInWithEmailLink(auth, url)
}

/** Correo guardado al pedir el enlace (si se abre en el mismo navegador). */
export function getRememberedEmail() {
  return safeGet(EMAIL_KEY)
}

/** Datos del formulario de registro, si la persona venía de "Crear cuenta". */
export function takePendingProfile(): ProfileInput | null {
  const raw = safeGet(PENDING_PROFILE_KEY)
  safeSet(PENDING_PROFILE_KEY, null)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as Partial<ProfileInput>
    if (typeof p.nombre === 'string' && p.nombre.trim()) {
      return { nombre: p.nombre, celular: p.celular ?? '', ciudad: p.ciudad ?? '' }
    }
  } catch {
    // dato dañado: se ignora
  }
  return null
}

/** Termina el ingreso con el enlace que llegó al correo. */
export async function completeMagicLink(email: string, url: string) {
  const result = await signInWithEmailLink(auth, email.trim().toLowerCase(), url)
  safeSet(EMAIL_KEY, null)
  return result.user
}

/** Traduce los errores de Firebase a mensajes entendibles. */
export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido. Revisa que esté bien escrito.'
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'Este enlace ya se usó o venció. Pide uno nuevo desde "Iniciar sesión".'
    case 'auth/configuration-not-found':
      return 'Authentication todavía no está activado en el proyecto de Firebase.'
    case 'auth/operation-not-allowed':
      return 'El acceso por enlace de correo no está activado en Firebase.'
    case 'auth/quota-exceeded':
      return 'Se alcanzó el límite diario de correos. Intenta de nuevo mañana.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    case 'auth/network-request-failed':
      return 'No hay conexión a internet. Revisa tu red e intenta de nuevo.'
    case 'auth/unauthorized-continue-uri':
    case 'auth/unauthorized-domain':
      return 'Esta dirección web no está autorizada en Firebase.'
    default:
      return 'Ocurrió un error inesperado. Intenta de nuevo.'
  }
}
