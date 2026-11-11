import {
  ChartColumn,
  Gift,
  LayoutDashboard,
  MapPin,
  Receipt,
  Recycle,
  Scale,
  Users,
  Warehouse,
} from 'lucide-react'
import { Link, Route, Routes } from 'react-router'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import { Card, CardHeader, ComingSoon, EmptyState, PageTitle, StatCard } from '../../components/ui'
import { BarList } from '../../components/recycling'
import { formatDate, formatPoints } from '../../lib/format'
import { useAllDeliveries } from '../../lib/recycling'
import { useAllRedemptions, useUsers } from '../../lib/rewards'
import { pointsOf, roleLabels } from '../../lib/users'
import { MaterialsAdmin } from "./MaterialsAdmin"
import { PointsAdmin } from "./PointsAdmin"
import { StatsAdmin } from "./StatsAdmin"
import { RedemptionsAdmin } from './RedemptionsAdmin'
import { RewardsAdmin } from './RewardsAdmin'
import { UsersAdmin } from './UsersAdmin'

const nav: NavItem[] = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/admin/canjes', label: 'Solicitudes de canje', icon: Receipt },
  { to: "/admin/materiales", label: "Materiales", icon: Recycle },
  { to: "/admin/puntos-acopio", label: "Puntos de acopio", icon: MapPin },
  { to: "/admin/reportes", label: "Estadísticas", icon: ChartColumn },
  { to: "/admin/gestores", label: "Gestores", icon: Warehouse },
]

function Overview() {
  const users = useUsers()
  const redemptions = useAllRedemptions()

  const count = (n: number, loading: boolean) => (loading ? undefined : formatPoints(n))
  const recent = [...users.data].sort((a, b) => (b.creadoEn?.toMillis() ?? 0) - (a.creadoEn?.toMillis() ?? 0)).slice(0, 5)
  const pending = redemptions.data.filter((r) => r.estado === 'pendiente').length
  const deliveries = useAllDeliveries()
  const validated = deliveries.data.filter((d) => d.estado === 'validada')
  const totalKg = validated.reduce((s, d) => s + (d.pesoAceptado ?? 0), 0)
  const pendingDeliveries = deliveries.data.filter((d) => d.estado === 'pendiente').length
  const byMaterial = [
    ...validated.reduce((m, d) => m.set(d.materialNombre, (m.get(d.materialNombre) ?? 0) + (d.pesoAceptado ?? 0)), new Map<string, number>()),
  ]
    .map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

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
        <StatCard
          label="Kilos aprovechados"
          icon={Scale}
          value={deliveries.loading ? undefined : `${totalKg.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`}
          hint={pendingDeliveries > 0 ? `${pendingDeliveries} entregas por validar` : 'Entregas validadas'}
        />
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
          <CardHeader
            title="Material por tipo"
            description="Kilogramos validados"
            icon={ChartColumn}
            action={
              <Link to="/admin/reportes" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Ver estadísticas →
              </Link>
            }
          />
          {deliveries.loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ) : byMaterial.length === 0 ? (
            <EmptyState
              icon={Recycle}
              title="Sin datos para graficar"
              description="Aquí verás cuántos kilos se han recibido de cada material cuando se validen entregas."
            />
          ) : (
            <BarList data={byMaterial.slice(0, 6)} unit="kg" />
          )}
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
        <Route path="puntos-acopio" element={<PointsAdmin />} />
        <Route path="materiales" element={<MaterialsAdmin />} />
        <Route path="reportes" element={<StatsAdmin />} />
      </Routes>
    </DashboardLayout>
  )
}
