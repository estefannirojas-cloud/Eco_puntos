import {
  Coins,
  Gift,
  History,
  LayoutDashboard,
  Leaf,
  MapPin,
  Package,
  Recycle,
  Scale,
  Trophy,
  UserRound,
} from 'lucide-react'
import { Link, Route, Routes } from 'react-router'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import { Card, CardHeader, ComingSoon, EmptyState, PageTitle, StatCard } from '../../components/ui'

const nav: NavItem[] = [
  { to: '/cliente', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/cliente/entregas', label: 'Mis entregas', icon: History },
  { to: '/cliente/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/cliente/puntos-acopio', label: 'Puntos de acopio', icon: MapPin },
  { to: '/cliente/perfil', label: 'Mi perfil', icon: UserRound },
]

const materials = [
  { name: 'Plástico', tip: 'Botellas y envases limpios y secos' },
  { name: 'Papel y cartón', tip: 'Sin grasa ni humedad, doblado' },
  { name: 'Vidrio', tip: 'Botellas y frascos sin tapa' },
  { name: 'Metal', tip: 'Latas de aluminio y acero' },
]

function Overview() {
  return (
    <>
      <PageTitle title="¡Hola!" description="Este es el resumen de tu actividad en EcoPuntos." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Puntos disponibles" icon={Coins} />
        <StatCard label="Kilos reciclados" icon={Scale} />
        <StatCard label="Entregas realizadas" icon={Package} />
        <StatCard label="CO₂ evitado" icon={Leaf} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Actividad reciente" description="Tus últimas entregas registradas" icon={History} />
          <EmptyState
            icon={Recycle}
            title="Aún no tienes entregas"
            description="Cuando un gestor registre tu primera entrega en un punto de acopio, aparecerá aquí con los puntos ganados."
            action={
              <Link to="/cliente/puntos-acopio" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                Ver puntos de acopio →
              </Link>
            }
          />
        </Card>

        <Card>
          <CardHeader title="Tu próxima meta" icon={Trophy} />
          <EmptyState
            icon={Gift}
            title="Sin recompensas disponibles"
            description="El catálogo de recompensas se mostrará aquí cuando esté configurado."
          />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="¿Qué puedes reciclar?" description="Guía rápida para preparar tus materiales" icon={Recycle} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {materials.map((m) => (
            <div key={m.name} className="rounded-xl bg-brand-50 p-4">
              <p className="font-semibold text-brand-900">{m.name}</p>
              <p className="mt-1 text-sm text-brand-800/80">{m.tip}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

export function ClientPanel() {
  return (
    <DashboardLayout roleLabel="Cliente" nav={nav}>
      <Routes>
        <Route index element={<Overview />} />
        <Route
          path="entregas"
          element={
            <ComingSoon
              title="Mis entregas"
              description="Historial de materiales entregados y puntos obtenidos."
              icon={History}
              features={['Ver cada entrega con fecha, material y peso', 'Consultar los puntos ganados por entrega', 'Filtrar por mes o tipo de material', 'Descargar tu historial']}
            />
          }
        />
        <Route
          path="recompensas"
          element={
            <ComingSoon
              title="Recompensas"
              description="Cambia tus EcoPuntos por beneficios."
              icon={Gift}
              features={['Explorar el catálogo de recompensas', 'Canjear tus puntos', 'Ver tus canjes anteriores', 'Recibir el código de tu beneficio']}
            />
          }
        />
        <Route
          path="puntos-acopio"
          element={
            <ComingSoon
              title="Puntos de acopio"
              description="Lugares donde puedes entregar tus materiales."
              icon={MapPin}
              features={['Ver la dirección de cada punto', 'Consultar horarios de atención', 'Saber qué materiales recibe cada punto', 'Ver la ubicación en el mapa']}
            />
          }
        />
        <Route
          path="perfil"
          element={
            <ComingSoon
              title="Mi perfil"
              description="Tus datos personales y preferencias."
              icon={UserRound}
              features={['Actualizar nombre, celular y ciudad', 'Ver tu código de cliente', 'Configurar notificaciones', 'Cerrar sesión']}
            />
          }
        />
      </Routes>
    </DashboardLayout>
  )
}
