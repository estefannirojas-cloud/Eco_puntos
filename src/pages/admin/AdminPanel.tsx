import {
  ChartColumn,
  Gift,
  LayoutDashboard,
  MapPin,
  Receipt,
  Recycle,
  Scale,
  Settings2,
  Users,
  Warehouse,
} from 'lucide-react'
import { Link, Route, Routes } from 'react-router'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import { Card, CardHeader, ComingSoon, EmptyState, PageTitle, StatCard } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import { useAllRedemptions, useUsers } from '../../lib/rewards'
import { pointsOf, roleLabels } from '../../lib/users'
import { RedemptionsAdmin } from './RedemptionsAdmin'
import { RewardsAdmin } from './RewardsAdmin'
import { UsersAdmin } from './UsersAdmin'

const nav: NavItem[] = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/admin/canjes', label: 'Solicitudes de canje', icon: Receipt },
  { to: '/admin/gestores', label: 'Gestores', icon: Warehouse },
  { to: '/admin/puntos-acopio', label: 'Puntos de acopio', icon: MapPin },
  { to: '/admin/materiales', label: 'Materiales y puntos', icon: Settings2 },
  { to: '/admin/reportes', label: 'Reportes', icon: ChartColumn },
]

function Overview() {
  const users = useUsers()
  const redemptions = useAllRedemptions()

  const count = (n: number, loading: boolean) => (loading ? undefined : formatPoints(n))
  const recent = [...users.data].sort((a, b) => (b.creadoEn?.toMillis() ?? 0) - (a.creadoEn?.toMillis() ?? 0)).slice(0, 5)
  const pending = redemptions.data.filter((r) => r.estado === 'pendiente').length

  return (
    <>
      <PageTitle title="Panel de administración" description="Vista general del programa EcoPuntos." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Usuarios registrados" icon={Users} value={count(users.data.length, users.loading)} hint="Todas las cuentas" />
        <StatCard
          label="Gestores"
          icon={Warehouse}
          value={count(users.data.filter((u) => u.rol === 'gestor').length, users.loading)}
          hint="Con rol de gestor"
        />
        <StatCard label="Kilos aprovechados" icon={Scale} />
        <StatCard label="Canjes pendientes" icon={Receipt} value={count(pending, redemptions.loading)} hint="Esperando revisión" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Últimos usuarios registrados"
            icon={Users}
            action={
              <Link to="/admin/usuarios" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Ver todos →
              </Link>
            }
          />
          {users.loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ) : recent.length === 0 ? (
            <EmptyState icon={Users} title="No hay usuarios para mostrar" description="Aquí aparecerán las personas que se registren." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((u) => (
                <li key={u.uid} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{u.nombre}</p>
                    <p className="truncate text-sm text-slate-500">{u.correo}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-medium text-slate-700">{roleLabels[u.rol]}</p>
                    <p className="text-xs text-slate-400">
                      {formatPoints(pointsOf(u))} pts · {formatDate(u.creadoEn)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Material por tipo" icon={ChartColumn} />
          <EmptyState
            icon={Recycle}
            title="Sin datos para graficar"
            description="Aquí verás cuántos kilos se han recibido de cada material cuando se registren entregas."
          />
        </Card>
      </div>
    </>
  )
}

export function AdminPanel() {
  return (
    <DashboardLayout roleLabel="Administrador" nav={nav}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="usuarios" element={<UsersAdmin />} />
        <Route path="recompensas" element={<RewardsAdmin />} />
        <Route path="canjes" element={<RedemptionsAdmin />} />
        <Route
          path="gestores"
          element={
            <ComingSoon
              title="Gestores"
              description="Responsables de los puntos de acopio."
              icon={Warehouse}
              features={['Invitar nuevos gestores por correo', 'Asignar un gestor a un punto de acopio', 'Revisar la actividad de cada gestor', 'Retirar permisos']}
            />
          }
        />
        <Route
          path="puntos-acopio"
          element={
            <ComingSoon
              title="Puntos de acopio"
              description="Lugares habilitados para recibir material."
              icon={MapPin}
              features={['Crear y editar puntos de acopio', 'Definir horarios y materiales aceptados', 'Activar o pausar un punto', 'Ver el volumen recibido por punto']}
            />
          }
        />
        <Route
          path="materiales"
          element={
            <ComingSoon
              title="Materiales y puntos"
              description="Reglas para calcular los EcoPuntos."
              icon={Settings2}
              features={['Definir los materiales aceptados', 'Fijar cuántos puntos vale cada kilo', 'Establecer pesos mínimos', 'Guardar el historial de cambios de tarifas']}
            />
          }
        />
        <Route
          path="reportes"
          element={
            <ComingSoon
              title="Reportes"
              description="Indicadores de impacto del programa."
              icon={ChartColumn}
              features={['Kilos aprovechados por mes y material', 'Participación por ciudad', 'Estimación de CO₂ evitado', 'Exportar reportes a Excel o PDF']}
            />
          }
        />
      </Routes>
    </DashboardLayout>
  )
}
