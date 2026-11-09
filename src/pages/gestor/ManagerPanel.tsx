import {
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  Scale,
  UserRound,
  Users,
  Warehouse,
} from 'lucide-react'
import { Route, Routes } from 'react-router'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import type { NavItem } from '../../layouts/DashboardLayout'
import {
  Card,
  CardHeader,
  ComingSoon,
  EmptyState,
  NotConnectedNote,
  PageTitle,
  StatCard,
  buttonPrimary,
  inputClass,
} from '../../components/ui'

const nav: NavItem[] = [
  { to: '/gestor', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/gestor/recepciones', label: 'Recepciones', icon: ClipboardList },
  { to: '/gestor/clientes', label: 'Clientes', icon: Users },
  { to: '/gestor/punto-acopio', label: 'Mi punto de acopio', icon: Warehouse },
]

const materialOptions = ['Plástico', 'Papel y cartón', 'Vidrio', 'Metal', 'Tetra Pak']

function Overview() {
  return (
    <>
      <PageTitle title="Panel del gestor" description="Registra las entregas de material y consulta la actividad de tu punto de acopio." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Recepciones de hoy" icon={ClipboardList} />
        <StatCard label="Kilos recibidos hoy" icon={Scale} />
        <StatCard label="Clientes atendidos" icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Registrar recepción" description="Material entregado por un cliente" icon={PackagePlus} />
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <fieldset disabled className="space-y-4">
              <div>
                <label htmlFor="client" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Correo o código del cliente
                </label>
                <input id="client" placeholder="cliente@ejemplo.com" className={inputClass} />
              </div>
              <div>
                <label htmlFor="material" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tipo de material
                </label>
                <select id="material" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Selecciona un material
                  </option>
                  {materialOptions.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="weight" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Peso (kg)
                </label>
                <input id="weight" type="number" min="0" step="0.1" placeholder="0,0" className={inputClass} />
              </div>
              <button type="submit" className={`${buttonPrimary} w-full`}>
                Registrar entrega
              </button>
            </fieldset>
            <NotConnectedNote>
              El registro de entregas y el cálculo de puntos se activarán cuando conectemos la base de datos.
            </NotConnectedNote>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Recepciones recientes" description="Entregas registradas en tu punto" icon={ClipboardList} />
          <EmptyState
            icon={Package}
            title="No hay recepciones registradas"
            description="Las entregas que registres aparecerán aquí con el cliente, el material, el peso y los puntos asignados."
          />
        </Card>
      </div>
    </>
  )
}

export function ManagerPanel() {
  return (
    <DashboardLayout roleLabel="Gestor de reciclaje" nav={nav}>
      <Routes>
        <Route index element={<Overview />} />
        <Route
          path="recepciones"
          element={
            <ComingSoon
              title="Recepciones"
              description="Historial completo de material recibido."
              icon={ClipboardList}
              features={['Ver todas las entregas registradas', 'Filtrar por fecha, cliente o material', 'Corregir una entrega con error', 'Exportar el reporte del día']}
            />
          }
        />
        <Route
          path="clientes"
          element={
            <ComingSoon
              title="Clientes"
              description="Personas que entregan material en tu punto."
              icon={UserRound}
              features={['Buscar clientes por nombre o correo', 'Ver el historial de cada cliente', 'Consultar su saldo de puntos', 'Verificar la identidad al recibir']}
            />
          }
        />
        <Route
          path="punto-acopio"
          element={
            <ComingSoon
              title="Mi punto de acopio"
              description="Información del lugar que administras."
              icon={Warehouse}
              features={['Actualizar dirección y horarios', 'Indicar qué materiales recibes', 'Ver la capacidad de almacenamiento', 'Programar recolecciones']}
            />
          }
        />
      </Routes>
    </DashboardLayout>
  )
}
