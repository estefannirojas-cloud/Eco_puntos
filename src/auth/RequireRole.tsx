import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { FullPageLoader } from '../components/FullPageLoader'
import { roleHome } from '../lib/users'
import type { Role } from '../lib/users'
import { useAuth } from './context'

/**
 * Deja pasar solo a personas con sesión y con el rol indicado.
 * Los administradores pueden entrar a todos los paneles.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, profile, loading, error } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />
  if (error) return <FullPageLoader message={error} />
  if (!profile) return <Navigate to="/completar-perfil" replace />
  if (profile.rol !== role && profile.rol !== 'admin') return <Navigate to={roleHome[profile.rol]} replace />

  return children
}
