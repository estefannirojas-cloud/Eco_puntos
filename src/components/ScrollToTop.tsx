import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Al cambiar de pantalla, vuelve arriba (salvo si se apunta a una sección con #). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}
