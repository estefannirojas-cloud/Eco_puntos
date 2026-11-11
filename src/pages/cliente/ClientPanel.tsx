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
import { DeliveryStatusBadge } from "../../components/recycling"
import { formatDate } from "../../lib/format"
import { useMyDeliveries } from "../../lib/recycling"
import type { Delivery } from "../../lib/recycling"
import { MyDeliveries, PointsDirectory, RegisterDelivery } from "./ClientRecycling"
import { MyRedemptions } from './MyRedemptions'
import { RewardsCatalog } from './RewardsCatalog'

const nav: NavItem[] = [
  { to: '/cliente', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: "/cliente/registrar", label: "Registrar entrega", icon: Recycle },
  { to: "/cliente/entregas", label: "Mis entregas", icon: History },
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

function RecentDeliveries({ deliveries, loading }: { deliveries: Delivery[]; loading: boolean }) {
  if (loading) return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={Recycle}
        title="Aún no tienes entregas"
        description="Registra tu primera entrega y llévala a un punto de acopio. Cuando el gestor la valide, verás aquí los puntos ganados."
        action={
          <Link to="/cliente/registrar" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Registrar entrega →
          </Link>
        }
      />
    )
  }
  return (
    <ul className="divide-y divide-slate-100">
      {deliveries.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{d.materialNombre} · {(d.pesoAceptado ?? d.pesoDeclarado).toLocaleString("es-CO")} kg</p>
            <p className="truncate text-xs text-slate-500">{d.puntoNombre} · {formatDate(d.creadoEn)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DeliveryStatusBadge status={d.estado} />
            {d.estado === "validada" && <span className="text-xs font-semibold text-brand-700">+{formatPoints(d.puntos ?? 0)} pts</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}

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
  const { user } = useAuth()
  const deliveries = useMyDeliveries(user?.uid)
  const validated = deliveries.data.filter((d) => d.estado === "validada")
  const totalKg = validated.reduce((s, d) => s + (d.pesoAceptado ?? 0), 0)
  const pending = deliveries.data.filter((d) => d.estado === "pendiente").length
  const firstName = profile?.nombre.split(" ")[0]
  return (
    <>
      <PageTitle title={firstName ? `¡Hola, ${firstName}!` : "¡Hola!"} description="Este es el resumen de tu actividad en EcoPuntos." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Puntos disponibles" icon={Coins} value={formatPoints(pointsOf(profile))} hint="Beneficio promocional, no es dinero" />
        <StatCard label="Kilos reciclados" icon={Scale} value={deliveries.loading ? undefined : `${totalKg.toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg`} hint="Entregas validadas" />
        <StatCard label="Entregas realizadas" icon={Package} value={deliveries.loading ? undefined : String(validated.length)} hint={pending > 0 ? `${pending} por validar` : "Validadas por un gestor"} />
        <StatCard label="CO₂ evitado" icon={Leaf} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Actividad reciente" description="Tus últimas entregas registradas" icon={History} />
          <RecentDeliveries deliveries={deliveries.data.slice(0, 5)} loading={deliveries.loading} />
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
        <Route path="registrar" element={<RegisterDelivery />} />
        <Route path="entregas" element={<MyDeliveries />} />
        <Route path="recompensas" element={<RewardsCatalog />} />
        <Route path="canjes" element={<MyRedemptions />} />
        <Route path="puntos-acopio" element={<PointsDirectory />} />
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
