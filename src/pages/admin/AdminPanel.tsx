import {
  ChartColumn,
  Coins,
  Gift,
  LayoutDashboard,
  MapPin,
  Recycle,
  Scale,
  Settings2,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react'
import { Route, Routes } from 'react-router'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import { Card, CardHeader, ComingSoon, EmptyState, PageTitle, StatCard, buttonSecondary } from '../../components/ui'

const nav: NavItem[] = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/gestores', label: 'Gestores', icon: Warehouse },
  { to: '/admin/puntos-acopio', label: 'Puntos de acopio', icon: MapPin },
  { to: '/admin/materiales', label: 'Materiales y puntos', icon: Settings2 },
  { to: '/admin/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/admin/reportes', label: 'Reportes', icon: ChartColumn },
]

function Overview() {
  return (
    <>
      <PageTitle title="Panel de administración" description="Vista general del programa EcoPuntos." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Usuarios registrados" icon={Users} />
        <StatCard label="Gestores activos" icon={Warehouse} />
        <StatCard label="Kilos aprovechados" icon={Scale} />
        <StatCard label="Puntos otorgados" icon={Coins} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Últimos usuarios registrados"
            icon={Users}
            action={
              <button type="button" disabled className={`${buttonSecondary} px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50`}>
                <UserPlus className="size-4" aria-hidden="true" />
                Invitar gestor
              </button>
            }
          />
          <table className="mb-4 hidden w-full text-left text-sm sm:table">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-4 font-semibold">Nombre</th>
                <th className="py-3 pr-4 font-semibold">Correo</th>
                <th className="py-3 pr-4 font-semibold">Rol</th>
                <th className="py-3 font-semibold">Fecha de registro</th>
              </tr>
            </thead>
          </table>
          <EmptyState
            icon={Users}
            title="No hay usuarios para mostrar"
            description="La lista se llenará cuando conectemos la base de datos."
          />
        </Card>

        <Card>
          <CardHeader title="Material por tipo" icon={ChartColumn} />
          <EmptyState
            icon={Recycle}
            title="Sin datos para graficar"
            description="Aquí verás cuántos kilos se han recibido de cada material."
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
        <Route
          path="usuarios"
          element={
            <ComingSoon
              title="Usuarios"
              description="Todas las personas registradas en EcoPuntos."
              icon={Users}
              features={['Buscar y filtrar usuarios', 'Cambiar el rol de un usuario', 'Desactivar cuentas', 'Ver el historial de cada persona']}
            />
          }
        />
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
          path="recompensas"
          element={
            <ComingSoon
              title="Recompensas"
              description="Catálogo de beneficios para canjear."
              icon={Gift}
              features={['Crear recompensas con su costo en puntos', 'Controlar el inventario disponible', 'Aprobar o rechazar canjes', 'Registrar aliados que ofrecen beneficios']}
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
