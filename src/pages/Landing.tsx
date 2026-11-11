import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Building2,
  CircleCheck,
  Cloud,
  Coins,
  Gift,
  HandCoins,
  Leaf,
  MapPin,
  Recycle,
  ShieldCheck,
  Sprout,
  TreePine,
  Truck,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react'
import { Link } from 'react-router'
import { Footer } from '../components/Footer'
import { PublicHeader } from '../components/PublicHeader'
import { DemoBadge } from '../components/ui'

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: UserPlus, title: 'Regístrate', text: 'Crea tu cuenta gratis con tu correo electrónico y una contraseña.' },
  { icon: Recycle, title: 'Separa tus residuos', text: 'Clasifica plástico, papel, cartón, vidrio y metal limpios y secos.' },
  { icon: Truck, title: 'Entrégalos', text: 'Llévalos a un punto de acopio, donde un gestor pesa y registra tu entrega.' },
  { icon: Gift, title: 'Gana y canjea', text: 'Acumula EcoPuntos por cada kilo y cámbialos por beneficios.' },
]

const benefits: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: TreePine, title: 'Cuidas el planeta', text: 'Menos residuos en rellenos sanitarios y más materiales que vuelven a la cadena productiva.' },
  { icon: HandCoins, title: 'Tu esfuerzo vale', text: 'Cada kilo entregado se convierte en puntos que puedes cambiar por recompensas.' },
  { icon: Recycle, title: 'Economía circular', text: 'Los materiales se transforman en nuevos productos en lugar de convertirse en basura.' },
  { icon: Users, title: 'Comunidad que suma', text: 'Hogares, gestores y organizaciones trabajando juntos por un territorio más limpio.' },
]

const indicators: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: Recycle, value: '12,5 t', label: 'Residuos aprovechados' },
  { icon: Users, value: '3.200', label: 'Personas participando' },
  { icon: MapPin, value: '18', label: 'Puntos de acopio' },
  { icon: Cloud, value: '9,4 t', label: 'CO₂ evitado' },
]

const roles: { icon: LucideIcon; title: string; text: string; items: string[] }[] = [
  {
    icon: Sprout,
    title: 'Clientes',
    text: 'Hogares y personas que reciclan.',
    items: ['Consultan su saldo de puntos', 'Revisan el historial de entregas', 'Canjean recompensas'],
  },
  {
    icon: Warehouse,
    title: 'Gestores de reciclaje',
    text: 'Responsables de los puntos de acopio.',
    items: ['Reciben y pesan el material', 'Registran las entregas', 'Asignan los puntos'],
  },
  {
    icon: Building2,
    title: 'Administradores',
    text: 'Equipo que coordina el programa.',
    items: ['Gestionan usuarios y gestores', 'Definen puntos por material', 'Consultan reportes de impacto'],
  },
]

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Portada */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
          <div
            className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand-200/40 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
                <Leaf className="size-4" aria-hidden="true" />
                Programa de reciclaje con recompensas
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-5xl lg:text-6xl">
                Reciclar tiene valor,{' '}
                <span className="text-brand-600">transformar tiene futuro</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                EcoPuntos premia a las personas que separan y entregan sus residuos aprovechables.
                Cada entrega suma puntos que puedes canjear, mientras ayudas a que los materiales
                vuelvan a la economía.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/registro"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-700/20 hover:bg-brand-800"
                >
                  Crear mi cuenta gratis
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/ingresar"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-brand-900 hover:bg-slate-50"
                >
                  Iniciar sesión
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {['Registro gratuito', 'Acceso seguro', 'Desde el celular'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CircleCheck className="size-4 text-brand-500" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ilustración: vista previa de la tarjeta de puntos */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-3xl bg-brand-900 p-7 text-white shadow-2xl shadow-brand-900/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-200">Así se verá tu saldo</p>
                  <DemoBadge label="Ejemplo" />
                </div>
                <p className="mt-6 text-sm text-brand-200">EcoPuntos disponibles</p>
                <p className="mt-1 flex items-baseline gap-2 text-5xl font-extrabold tracking-tight">
                  1.250
                  <Coins className="size-8 text-lime-accent" aria-hidden="true" />
                </p>
                <div className="mt-6 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-2/3 rounded-full bg-lime-accent" />
                </div>
                <p className="mt-2 text-xs text-brand-200">Te faltan 750 puntos para tu próxima recompensa</p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    ['Plástico', '8 kg'],
                    ['Cartón', '12 kg'],
                    ['Vidrio', '5 kg'],
                  ].map(([m, kg]) => (
                    <div key={m} className="rounded-xl bg-white/10 px-2 py-3">
                      <p className="text-lg font-bold">{kg}</p>
                      <p className="text-xs text-brand-200">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:flex">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Entregas verificadas</p>
                  <p className="text-xs text-slate-500">Registradas por gestores autorizados</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Qué es */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">¿Qué es EcoPuntos?</p>
          <p className="mt-4 text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl">
            Una plataforma que conecta a quienes reciclan con los gestores de residuos, y reconoce
            cada entrega con puntos canjeables.
          </p>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-16 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Cómo funciona</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Cuatro pasos para empezar a ganar
              </h2>
            </div>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <span className="absolute right-5 top-5 text-4xl font-extrabold text-brand-100">{i + 1}</span>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-700 text-white">
                    <s.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="scroll-mt-16 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Beneficios</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Reciclar es bueno para ti y para tu entorno
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b) => (
                <div key={b.title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-brand-300 hover:shadow-md">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <b.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Indicadores de demostración */}
        <section id="impacto" className="scroll-mt-16 bg-brand-900 py-16 text-white md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wider text-lime-accent">Impacto ambiental</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Indicadores del programa</h2>
              </div>
              <DemoBadge label="Datos de demostración, no son reales" />
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {indicators.map((d) => (
                <div key={d.label} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                  <d.icon className="size-7 text-lime-accent" aria-hidden="true" />
                  <p className="mt-4 text-4xl font-extrabold tracking-tight">{d.value}</p>
                  <p className="mt-1 text-sm text-brand-200">{d.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-brand-200/80">
              Estas cifras son ilustrativas y sirven para mostrar el diseño. Se reemplazarán por los
              datos reales del programa cuando la plataforma esté conectada.
            </p>
          </div>
        </section>

        {/* Participantes */}
        <section id="participantes" className="scroll-mt-16 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Participantes</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
                Una plataforma, tres roles
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {roles.map((r) => (
                <div key={r.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <r.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{r.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{r.text}</p>
                  <ul className="mt-4 space-y-2">
                    {r.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-slate-700">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden="true" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Llamado final */}
        <section className="px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-12 text-white md:flex-row md:items-center md:px-12">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">¿Listo para que tu reciclaje cuente?</h2>
              <p className="mt-2 text-brand-100">Únete a EcoPuntos y empieza a sumar desde tu primera entrega.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/registro" className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-brand-900 hover:bg-brand-50">
                Registrarme
              </Link>
              <Link to="/ingresar" className="rounded-xl border border-white/30 px-6 py-3 text-center font-semibold text-white hover:bg-white/10">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
