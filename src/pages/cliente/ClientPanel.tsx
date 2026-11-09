import {
  Coins,
  Gift,
  History,
  LayoutDashboard,
  Leaf,
  MapPin,
  Package,
  Receipt,
  Recycle,
  Scale,
  Trophy,
  UserRound,
} from 'lucide-react'
import { Link, Route, Routes } from 'react-router'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import { useAuth } from '../../auth/context'
import { Card, CardHeader, ComingSoon, EmptyState, PageTitle, StatCard } from '../../components/ui'
import { formatPoints } from '../../lib/format'
import { availability, useRewards } from '../../lib/rewards'
import { pointsOf } from '../../lib/users'
import { MyRedemptions } from './MyRedemptions'
import { RewardsCatalog } from './RewardsCatalog'

const nav: NavItem[] = [
  { to: '/cliente', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/cliente/entregas', label: 'Mis entregas', icon: History },
  { to: '/cliente/recompensas', label: 'Recompensas', icon: Gift },
  { to: '/cliente/canjes', label: 'Mis canjes', icon: Receipt },
  { to: '/cliente/puntos-acopio', label: 'Puntos de acopio', icon: MapPin },
  { to: '/cliente/perfil', label: 'Mi perfil', icon: UserRound },
]

const materials = [
  { name: 'Plástico', tip: 'Botellas y envases limpios y secos' },
  { name: 'Papel y cartón', tip: 'Sin grasa ni humedad, doblado' },
  { name: 'Vidrio', tip: 'Botellas y frascos sin tapa' },
  { name: 'Metal', tip: 'Latas de aluminio y acero' },
]

/** Muestra la recompensa más cercana según el saldo (con datos reales del catálogo). */
function NextGoal({ balance }: { balance: number }) {
  const { data: rewards, loading } = useRewards()
  const available = rewards.filter((r) => availability(r).available)
  const affordable = available.filter((r) => r.puntos <= balance)
  const next = available.find((r) => r.puntos > balance)

  return (
    <Card>
      <CardHeader title="Tu próxima meta" icon={Trophy} />
      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : available.length === 0 ? (
        <EmptyState icon={Gift} title="Sin recompensas disponibles" description="Pronto habrá beneficios para canjear." />
      ) : (
        <div className="space-y-4">
          {affordable.length > 0 && (
            <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
              🎉 Ya puedes canjear <span className="font-semibold">{affordable.length}</span>{' '}
              {affordable.length === 1 ? 'recompensa' : 'recompensas'}.
            </p>
          )}
          {next && (
            <div>
              <p className="text-sm font-semibold text-slate-800">{next.nombre}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (balance / next.puntos) * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Te faltan {formatPoints(next.puntos - balance)} de {formatPoints(next.puntos)} puntos
              </p>
            </div>
          )}
          <Link to="/cliente/recompensas" className="inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
            Ver catálogo →
          </Link>
        </div>
      )}
    </Card>
  )
}

function Overview() {
  const { profile } = useAuth()
  const firstName = profile?.nombre.split(" ")[0]
  return (
    <>
      <PageTitle title={firstName ? `¡Hola, ${firstName}!` : "¡Hola!"} description="Este es el resumen de tu actividad en EcoPuntos." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Puntos disponibles" icon={Coins} value={formatPoints(pointsOf(profile))} hint="Beneficio promocional, no es dinero" />
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

        <NextGoal balance={pointsOf(profile)} />
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
        <Route path="recompensas" element={<RewardsCatalog />} />
        <Route path="canjes" element={<MyRedemptions />} />
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
