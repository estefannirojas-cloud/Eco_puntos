import type { LucideIcon } from 'lucide-react'
import { FlaskConical, Info, PlugZap } from 'lucide-react'
import type { ReactNode } from 'react'

/** Etiqueta que marca un dato como ilustrativo (no real). */
export function DemoBadge({ label = 'Dato de demostración' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

/** Aviso de que una función todavía no está conectada a la base de datos. */
export function NotConnectedNote({ children }: { children?: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <PlugZap className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span>{children ?? 'Esta función se activará cuando conectemos la base de datos.'}</span>
    </p>
  )
}

export function InfoAlert({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-brand-800">{children}</div>
      </div>
    </div>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/** Indicador del panel. Si no hay valor real, muestra un guion y explica por qué. */
export function StatCard({
  label,
  icon: Icon,
  value,
  hint = 'Sin datos todavía',
}: {
  label: string
  icon: LucideIcon
  value?: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:size-9">
          <Icon className="size-4 sm:size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-brand-500 shadow-sm ring-1 ring-slate-200">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-slate-500">{description}</p>}
    </div>
  )
}

/** Pantalla para secciones del panel que se construirán en próximas etapas. */
export function ComingSoon({
  title,
  description,
  icon,
  features,
}: {
  title: string
  description: string
  icon: LucideIcon
  features: string[]
}) {
  return (
    <>
      <PageTitle title={title} description={description} />
      <Card>
        <EmptyState
          icon={icon}
          title="Sección en construcción"
          description="Esta sección ya tiene su lugar en la navegación. Su contenido se activará cuando conectemos la base de datos."
        />
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">Lo que podrás hacer aquí:</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </>
  )
}

export const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400'

export const buttonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-300'

export const buttonDanger =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:bg-slate-300'

export const buttonSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20'
