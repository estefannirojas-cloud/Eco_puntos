import { ChartColumn, ChartPie, Coins, Download, MapPin, Package, Recycle, Scale, Trophy, TriangleAlert, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarList, ColumnChart, DonutChart } from '../../components/recycling'
import type { ChartDatum } from '../../components/recycling'
import { Card, CardHeader, EmptyState, PageTitle, StatCard, buttonSecondary, inputClass } from '../../components/ui'
import { formatDate, formatPoints } from '../../lib/format'
import { deliveryDate, pointTypes, useAllDeliveries, useMaterials, usePoints } from '../../lib/recycling'
import type { Delivery, PointType } from '../../lib/recycling'

type Period = '7' | '30' | '90' | '365' | 'todo' | 'rango'
type Grouping = 'dia' | 'semana' | 'mes'

const kgFormat = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 })

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function bucketKey(date: Date, grouping: Grouping) {
  if (grouping === 'mes') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const d = startOfDay(date)
  if (grouping === 'semana') d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // lunes de esa semana
  return d.toISOString().slice(0, 10)
}

function bucketLabel(key: string, grouping: Grouping) {
  if (grouping === 'mes') {
    const [y, m] = key.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
  }
  const [y, m, d] = key.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  return grouping === 'semana' ? `Sem. ${label}` : label
}

/** Agrupa kg por día/semana/mes, incluyendo los periodos sin entregas (en cero). */
function timeSeries(deliveries: Delivery[], grouping: Grouping, from: Date | null, to: Date): ChartDatum[] {
  const totals = new Map<string, number>()
  for (const d of deliveries) {
    const date = deliveryDate(d)
    if (date) totals.set(bucketKey(date, grouping), (totals.get(bucketKey(date, grouping)) ?? 0) + (d.pesoAceptado ?? 0))
  }
  const dates = deliveries.map(deliveryDate).filter((d): d is Date => d !== null)
  const start = from ?? (dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : to)
  const keys: string[] = []
  const cursor = startOfDay(start)
  if (grouping === 'mes') cursor.setDate(1)
  while (cursor <= to && keys.length < 400) {
    const key = bucketKey(cursor, grouping)
    if (!keys.includes(key)) keys.push(key)
    if (grouping === 'dia') cursor.setDate(cursor.getDate() + 1)
    else if (grouping === 'semana') cursor.setDate(cursor.getDate() + 7)
    else cursor.setMonth(cursor.getMonth() + 1)
  }
  return keys.map((k) => ({ label: bucketLabel(k, grouping), value: Math.round((totals.get(k) ?? 0) * 100) / 100 }))
}

function sumBy(deliveries: Delivery[], key: (d: Delivery) => string, value: (d: Delivery) => number) {
  const map = new Map<string, number>()
  for (const d of deliveries) map.set(key(d), (map.get(key(d)) ?? 0) + value(d))
  return [...map.entries()].map(([label, v]) => ({ label, value: Math.round(v * 100) / 100 })).sort((a, b) => b.value - a.value)
}

function downloadCsv(rows: Delivery[]) {
  const header = ['Fecha', 'Usuario', 'Correo', 'Punto de acopio', 'Material', 'Peso (kg)', 'Tarifa (pts/kg)', 'Puntos', 'Validó']
  const lines = rows.map((d) =>
    [formatDate(d.validadoEn ?? d.creadoEn), d.clienteNombre, d.clienteCorreo, d.puntoNombre, d.materialNombre, d.pesoAceptado ?? '', d.tarifaAplicada ?? '', d.puntos ?? '', d.validadorNombre ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(';'),
  )
  const blob = new Blob(['﻿' + [header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ecopuntos-movimientos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function StatsAdmin() {
  const deliveries = useAllDeliveries()
  const materials = useMaterials()
  const points = usePoints()

  const [period, setPeriod] = useState<Period>('30')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pointId, setPointId] = useState('')
  const [pointType, setPointType] = useState<'' | PointType>('')
  const [materialId, setMaterialId] = useState('')
  const [grouping, setGrouping] = useState<Grouping>('dia')

  const [now] = useState(() => new Date())
  const range = useMemo(() => {
    if (period === 'rango') {
      return { start: from ? new Date(`${from}T00:00:00`) : null, end: to ? new Date(`${to}T23:59:59`) : now }
    }
    if (period === 'todo') return { start: null, end: now }
    const start = startOfDay(now)
    start.setDate(start.getDate() - Number(period) + 1)
    return { start, end: now }
  }, [period, from, to, now])

  // Solo cuentan las entregas VALIDADAS (las que generaron puntos).
  const filtered = useMemo(
    () =>
      deliveries.data.filter((d) => {
        if (d.estado !== 'validada') return false
        const date = deliveryDate(d)
        if (!date) return false
        if (range.start && date < range.start) return false
        if (date > range.end) return false
        if (pointId && d.puntoId !== pointId) return false
        if (pointType && d.puntoTipo !== pointType) return false
        if (materialId && d.materialId !== materialId) return false
        return true
      }),
    [deliveries.data, range, pointId, pointType, materialId],
  )

  const totalKg = filtered.reduce((s, d) => s + (d.pesoAceptado ?? 0), 0)
  const totalPoints = filtered.reduce((s, d) => s + (d.puntos ?? 0), 0)
  const byMaterial = sumBy(filtered, (d) => d.materialNombre, (d) => d.pesoAceptado ?? 0)
  const byPoint = sumBy(filtered, (d) => d.puntoNombre, (d) => d.pesoAceptado ?? 0)
  const pointsByPoint = sumBy(filtered, (d) => d.puntoNombre, (d) => d.puntos ?? 0)
  const series = timeSeries(filtered, grouping, range.start, range.end)

  const loading = deliveries.loading || materials.loading || points.loading

  return (
    <>
      <PageTitle title="Estadísticas e indicadores" description="Volumen recibido, puntos generados y comportamiento del reciclaje. Solo cuentan las entregas validadas." />

      {/* Indicadores generales (no dependen de los filtros) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Materiales registrados" icon={Recycle} value={loading ? undefined : String(materials.data.length)} hint={`${materials.data.filter((m) => m.activo).length} activos`} />
        <StatCard label="Puntos de acopio" icon={Warehouse} value={loading ? undefined : String(points.data.length)} hint={`${points.data.filter((p) => p.estado === 'activo').length} activos`} />
        <StatCard label="Kilogramos recolectados" icon={Scale} value={loading ? undefined : `${kgFormat(totalKg)} kg`} hint="Con los filtros actuales" />
        <StatCard label="Puntos entregados" icon={Coins} value={loading ? undefined : formatPoints(totalPoints)} hint={`${filtered.length} entregas validadas`} />
      </div>

      {/* Filtros: una sola fila */}
      <Card className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={inputClass} aria-label="Periodo">
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
            <option value="todo">Todo el historial</option>
            <option value="rango">Rango de fechas…</option>
          </select>
          <select value={pointId} onChange={(e) => setPointId(e.target.value)} className={inputClass} aria-label="Punto de acopio">
            <option value="">Todos los puntos de acopio</option>
            {points.data.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select value={pointType} onChange={(e) => setPointType(e.target.value as '' | PointType)} className={inputClass} aria-label="Tipo de establecimiento">
            <option value="">Todos los tipos de establecimiento</option>
            {(Object.keys(pointTypes) as PointType[]).map((t) => <option key={t} value={t}>{pointTypes[t].label}</option>)}
          </select>
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={inputClass} aria-label="Material">
            <option value="">Todos los materiales</option>
            {materials.data.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        {period === 'rango' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">Fecha inicial<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} mt-1`} /></label>
            <label className="text-sm text-slate-600">Fecha final<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} mt-1`} /></label>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : deliveries.error ? (
        <EmptyState icon={TriangleAlert} title="No se pudieron cargar las entregas" description={deliveries.error} />
      ) : (
        <>
          {/* Destacados */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl bg-brand-900 p-5 text-white">
              <Trophy className="size-8 shrink-0 text-lime-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm text-brand-200">Material más recolectado</p>
                <p className="truncate text-lg font-bold">{byMaterial[0] ? `${byMaterial[0].label} · ${kgFormat(byMaterial[0].value)} kg` : 'Sin datos'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-brand-900 p-5 text-white">
              <MapPin className="size-8 shrink-0 text-lime-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm text-brand-200">Punto con mayor volumen</p>
                <p className="truncate text-lg font-bold">{byPoint[0] ? `${byPoint[0].label} · ${kgFormat(byPoint[0].value)} kg` : 'Sin datos'}</p>
              </div>
            </div>
          </div>

          {/* Volumen en el tiempo */}
          <Card className="mt-6">
            <CardHeader
              title="Kilogramos recibidos en el tiempo"
              icon={ChartColumn}
              action={
                <div className="flex rounded-lg bg-slate-100 p-1 text-sm" role="radiogroup" aria-label="Agrupar por">
                  {(['dia', 'semana', 'mes'] as Grouping[]).map((g) => (
                    <button key={g} type="button" role="radio" aria-checked={grouping === g} onClick={() => setGrouping(g)} className={`rounded-md px-3 py-1 font-medium ${grouping === g ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                      {g === 'dia' ? 'Día' : g === 'semana' ? 'Semana' : 'Mes'}
                    </button>
                  ))}
                </div>
              }
            />
            <ColumnChart data={series} unit="kg" />
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Material recibido por tipo" description="Porcentaje de kilogramos" icon={ChartPie} />
              <DonutChart data={byMaterial} unit="kg" />
            </Card>
            <Card>
              <CardHeader title="Comparación entre puntos de acopio" description="Kilogramos recibidos" icon={Warehouse} />
              <BarList data={byPoint.slice(0, 10)} unit="kg" />
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader title="Puntos generados por punto de acopio" icon={Coins} />
            <BarList data={pointsByPoint.slice(0, 10)} unit="pts" />
          </Card>

          {/* Tabla de movimientos */}
          <Card className="mt-6 p-0 sm:p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Package className="size-5" aria-hidden="true" /></span>
                <div>
                  <h2 className="font-semibold text-slate-900">Movimientos</h2>
                  <p className="text-sm text-slate-500">{filtered.length} entregas validadas con estos filtros</p>
                </div>
              </div>
              <button type="button" onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0} className={`${buttonSecondary} px-3 py-2 text-sm`}>
                <Download className="size-4" aria-hidden="true" /> Descargar (Excel/CSV)
              </button>
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 pb-6"><EmptyState icon={Package} title="Sin movimientos" description="No hay entregas validadas con estos filtros." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Fecha de entrega</th>
                      <th className="px-4 py-3 font-semibold">Usuario</th>
                      <th className="px-4 py-3 font-semibold">Punto de acopio</th>
                      <th className="px-4 py-3 font-semibold">Material</th>
                      <th className="px-4 py-3 text-right font-semibold">Peso</th>
                      <th className="px-4 py-3 text-right font-semibold">Tarifa</th>
                      <th className="px-4 py-3 text-right font-semibold">Puntos</th>
                      <th className="px-4 py-3 font-semibold">Validó</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.slice(0, 300).map((d) => (
                      <tr key={d.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(d.validadoEn ?? d.creadoEn)}</td>
                        <td className="px-4 py-3 text-slate-900">{d.clienteNombre}</td>
                        <td className="px-4 py-3 text-slate-600">{d.puntoNombre}</td>
                        <td className="px-4 py-3 text-slate-700">{d.materialNombre}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{kgFormat(d.pesoAceptado ?? 0)} kg</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{formatPoints(d.tarifaAplicada ?? 0)}/kg</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-800">{formatPoints(d.puntos ?? 0)}</td>
                        <td className="px-4 py-3 text-slate-600">{d.validadorNombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > 300 && <p className="px-5 py-3 text-xs text-slate-500">Se muestran las 300 más recientes. Descarga el archivo para verlas todas.</p>}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
