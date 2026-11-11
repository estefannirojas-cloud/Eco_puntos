import { Clock, Coins, ExternalLink, Mail, MapPin, Phone, Scale, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { formatPoints } from '../lib/format'
import {
  deliveryStatusMeta,
  materialCategories,
  pointStatusMeta,
  pointTypes,
  weekDayLabels,
  weekDays,
} from '../lib/recycling'
import type { CollectionPoint, DeliveryStatus, Material, PointStatus } from "../lib/recycling"
import { mapEmbedUrl, mapsLink } from "../lib/recycling"

// ---------------------------------------------------------------------
// Etiquetas e iconos
// ---------------------------------------------------------------------

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${className}`}>
      {children}
    </span>
  )
}

export function PointStatusBadge({ status }: { status: PointStatus }) {
  return <Pill className={pointStatusMeta[status].className}>{pointStatusMeta[status].label}</Pill>
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <Pill className={deliveryStatusMeta[status].className}>{deliveryStatusMeta[status].label}</Pill>
}

/** Imagen del material, o el icono de su categoría si no tiene imagen. */
export function MaterialIcon({ material, size = 'md' }: { material: Pick<Material, 'categoria' | 'imagenUrl' | 'nombre'>; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState<string | null>(null)
  const cat = materialCategories[material.categoria] ?? materialCategories.otros
  const Icon = cat.icon
  const box = size === 'lg' ? 'size-14 rounded-2xl' : size === 'sm' ? 'size-8 rounded-lg' : 'size-11 rounded-xl'
  const icon = size === 'lg' ? 'size-7' : size === 'sm' ? 'size-4' : 'size-5'
  const url = material.imagenUrl?.trim()

  if (url && failed !== url) {
    return <img src={url} alt={material.nombre} onError={() => setFailed(url)} referrerPolicy="no-referrer" className={`${box} shrink-0 object-cover ring-1 ring-slate-200`} />
  }
  return (
    <span className={`flex shrink-0 items-center justify-center ring-1 ${cat.tone} ${box}`} aria-hidden="true">
      <Icon className={icon} />
    </span>
  )
}

export function PointTypeIcon({ tipo, className = 'size-5' }: { tipo: CollectionPoint['tipo']; className?: string }) {
  const Icon = (pointTypes[tipo] ?? pointTypes.otro).icon
  return <Icon className={className} aria-hidden="true" />
}

// ---------------------------------------------------------------------
// Pestañas simples
// ---------------------------------------------------------------------

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string }[] }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            value === t.id ? 'border-brand-600 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------
// Perfil de un punto de acopio
// ---------------------------------------------------------------------

export function ScheduleTable({ point }: { point: Pick<CollectionPoint, 'horario' | 'observacionesHorario'> }) {
  return (
    <div>
      <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
        {weekDays.map((day) => {
          const h = point.horario?.[day]
          return (
            <li key={day} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-medium text-slate-700">{weekDayLabels[day]}</span>
              {h?.abierto ? (
                <span className="tabular-nums text-slate-600">
                  {h.apertura} – {h.cierre}
                </span>
              ) : (
                <span className="text-slate-400">Cerrado</span>
              )}
            </li>
          )
        })}
      </ul>
      {point.observacionesHorario && <p className="mt-2 text-sm text-slate-500">{point.observacionesHorario}</p>}
    </div>
  )
}

/** Lista de materiales aceptados en un punto, con peso mínimo y tarifa vigente. */
export function AcceptedMaterials({ point, materials }: { point: Pick<CollectionPoint, 'materiales'>; materials: Material[] }) {
  const accepted = materials.filter((m) => m.id in (point.materiales ?? {}))
  if (accepted.length === 0) return <p className="text-sm text-slate-500">Aún no tiene materiales habilitados.</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {accepted.map((m) => (
        <li key={m.id} className={`flex gap-3 rounded-xl p-3 ring-1 ${m.activo ? 'bg-white ring-slate-200' : 'bg-slate-50 opacity-70 ring-slate-200'}`}>
          <MaterialIcon material={m} size="sm" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-slate-800">
              {m.nombre} {!m.activo && <span className="text-xs font-normal text-slate-500">(no disponible)</span>}
            </p>
            <p className="flex flex-wrap gap-x-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Scale className="size-3" aria-hidden="true" />
                mín. {m.pesoMinimo.toLocaleString('es-CO')} kg
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins className="size-3" aria-hidden="true" />
                {formatPoints(m.puntosPorKg)} pts/kg
              </span>
            </p>
            {point.materiales[m.id]?.restriccion && <p className="mt-1 text-xs text-amber-700">{point.materiales[m.id].restriccion}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PointProfile({ point, materials, showMap = true }: { point: CollectionPoint; materials: Material[]; showMap?: boolean }) {
  const [photoFailed, setPhotoFailed] = useState(false)
  return (
    <div className="space-y-6">
      {point.fotoUrl && !photoFailed && (
        <img src={point.fotoUrl} alt={point.nombre} onError={() => setPhotoFailed(true)} referrerPolicy="no-referrer" className="h-48 w-full rounded-xl object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <PointStatusBadge status={point.estado} />
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <PointTypeIcon tipo={point.tipo} className="size-4" />
          {pointTypes[point.tipo]?.label}
        </span>
      </div>
      {point.descripcion && <p className="text-sm text-slate-600">{point.descripcion}</p>}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
          <div>
            <dt className="sr-only">Dirección</dt>
            <dd className="text-slate-700">
              {point.direccion}
              {point.barrio && `, ${point.barrio}`}
              <br />
              <span className="text-slate-500">{point.municipio}</span>
            </dd>
          </div>
        </div>
        {point.responsable && (
          <div className="flex gap-2">
            <UserRound className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <dd className="text-slate-700">{point.responsable}</dd>
          </div>
        )}
        {point.telefono && (
          <div className="flex gap-2">
            <Phone className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <dd>
              <a href={`tel:${point.telefono}`} className="text-brand-700 hover:underline">{point.telefono}</a>
            </dd>
          </div>
        )}
        {point.correo && (
          <div className="flex gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <dd className="min-w-0 truncate">
              <a href={`mailto:${point.correo}`} className="text-brand-700 hover:underline">{point.correo}</a>
            </dd>
          </div>
        )}
      </dl>

      {showMap && (
        <div>
          {point.lat != null && point.lng != null && (
            <iframe
              title={`Mapa de ${point.nombre}`}
              src={mapEmbedUrl(point.lat, point.lng)}
              className="h-56 w-full rounded-xl ring-1 ring-slate-200"
              loading="lazy"
            />
          )}
          <a href={mapsLink(point)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Abrir en Google Maps <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      )}

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Clock className="size-4 text-brand-600" aria-hidden="true" /> Horario de atención
        </h3>
        <ScheduleTable point={point} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Materiales que recibe</h3>
        <AcceptedMaterials point={point} materials={materials} />
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------
// Gráficos (HTML + SVG, sin librerías externas)
// Paleta categórica de referencia (validada para daltonismo) para el gráfico circular.
// ---------------------------------------------------------------------

const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
const OTHER_COLOR = '#a3a29c'

export type ChartDatum = { label: string; value: number; detail?: string }

/** Barras horizontales: comparar magnitudes entre categorías (un solo color). */
export function BarList({ data, unit, emptyText = 'Sin datos para este filtro.' }: { data: ChartDatum[]; unit: string; emptyText?: string }) {
  const max = Math.max(0, ...data.map((d) => d.value))
  if (data.length === 0 || max === 0) return <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="group" title={`${d.label}: ${d.value.toLocaleString('es-CO')} ${unit}${d.detail ? ` · ${d.detail}` : ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{d.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {d.value.toLocaleString('es-CO', { maximumFractionDigits: 2 })} <span className="font-normal text-slate-500">{unit}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-all group-hover:bg-brand-600" style={{ width: `${Math.max(1.5, (d.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Columnas en el tiempo (día, semana o mes). */
export function ColumnChart({ data, unit }: { data: ChartDatum[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(0, ...data.map((d) => d.value))
  if (data.length === 0 || max === 0) return <p className="py-8 text-center text-sm text-slate-500">Sin datos para este periodo.</p>
  const showEvery = Math.ceil(data.length / 12)
  return (
    <div>
      <div className="relative flex h-48 items-end gap-[2px] border-b border-slate-200" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div
            key={d.label}
            className="flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            role="img"
            aria-label={`${d.label}: ${d.value.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${unit}`}
          >
            <div
              className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-brand-700' : 'bg-brand-500'}`}
              style={{ height: `${d.value > 0 ? Math.max(2, (d.value / max) * 100) : 0}%` }}
            />
          </div>
        ))}
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <p className="font-semibold">{data[hover].label}</p>
            <p>
              {data[hover].value.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {unit}
            </p>
          </div>
        )}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-slate-500">
            {i % showEvery === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Gráfico circular (dona) con leyenda; más de 5 partes se agrupan en "Otros". */
export function DonutChart({ data, unit }: { data: ChartDatum[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5).reduce((s, d) => s + d.value, 0)
  const slices = rest > 0 ? [...top, { label: 'Otros', value: rest }] : top
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="py-8 text-center text-sm text-slate-500">Sin datos para este filtro.</p>

  const r = 60
  const c = 2 * Math.PI * r
  const lengths = slices.map((s) => (s.value / total) * c)
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  const color = (i: number, label: string) => (label === 'Otros' && i === 5 ? OTHER_COLOR : SERIES_COLORS[i])

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="size-44 -rotate-90" onMouseLeave={() => setHover(null)}>
          {slices.map((s, i) => {
            const len = lengths[i]
            return (
              <circle
                key={s.label}
                cx="80"
                cy="80"
                r={r}
                fill="none"
                stroke={color(i, s.label)}
                strokeWidth={hover === i ? 26 : 22}
                strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
                strokeDashoffset={-starts[i]}
                onMouseEnter={() => setHover(i)}
                className="cursor-pointer transition-[stroke-width]"
              >
                <title>{`${s.label}: ${s.value.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${unit}`}</title>
              </circle>
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {hover !== null ? (
            <>
              <span className="max-w-24 truncate text-xs text-slate-500">{slices[hover].label}</span>
              <span className="text-lg font-bold tabular-nums text-slate-900">{Math.round((slices[hover].value / total) * 100)}%</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold tabular-nums text-slate-900">{total.toLocaleString('es-CO', { maximumFractionDigits: 1 })}</span>
              <span className="text-xs text-slate-500">{unit}</span>
            </>
          )}
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: color(i, s.label) }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-slate-700">{s.label}</span>
            <span className="shrink-0 tabular-nums text-slate-900">
              {s.value.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {unit}
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-slate-500">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
