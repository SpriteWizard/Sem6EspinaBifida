"use client"

import { useEffect, useRef, useState } from "react"
import { getSession } from "next-auth/react"
import { AlertTriangle, BarChart3, CalendarDays, Loader2, Table2 } from "lucide-react"
import {
  Bar, BarChart, CartesianGrid, Cell, Label,
  Legend, Line, LineChart, Pie, PieChart,
  ReferenceLine, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from "recharts"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { cn } from "../lib/utils/cn"
import type {
  PorCurpData, PorResidenciaData, PorNacimientoData,
  PorEtapaSexoData, RegistrosMesData, PorEstadoData,
} from "../lib/types/metricas"
import GenerarReporteButton from "../components/GenerarReporteButton"

// ── Color tokens ──────────────────────────────────────────────────────────────
const CP = "#3b82f6"   // blue-500  — NL, mexicanos, primary series
const CN = "#94a3b8"   // slate-400 — foráneo, extranjeros, neutral series
const CA = "#f59e0b"   // amber-500 — hombres (M/H charts)
const AXIS = { fontSize: 11, fill: "#94a3b8" }
const GRID = "#f1f5f9"
const CHART_H = 260

// ── Stage abbreviations for chart X-axis ──────────────────────────────────────
const ABBR: Record<string, string> = {
  "Primera infancia": "0–5",
  "Infancia":         "6–11",
  "Adolescencia":     "12–17",
  "Jóvenes":          "18–29",
  "Adultos":          "30–59",
  "Adultos mayores":  "65+",
  "Sin clasificar":   "N/D",
}

function toChartRows<T extends { etapa: string }>(filas: T[]) {
  return filas
    .filter((f) => f.etapa !== "Sin clasificar")
    .map((f) => ({ ...f, label: ABBR[f.etapa] ?? f.etapa }))
}

// ── Date range ────────────────────────────────────────────────────────────────
type Preset = "today" | "7d" | "30d" | "custom"
interface DateRange { start: string; end: string }

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function presetRange(p: Exclude<Preset, "custom">): DateRange {
  const now = new Date()
  if (p === "today") return { start: toIso(now), end: toIso(now) }
  const s = new Date(now)
  s.setDate(s.getDate() - (p === "7d" ? 6 : 29))
  return { start: toIso(s), end: toIso(now) }
}

function DateRangePicker({
  range,
  onChange,
}: {
  range: DateRange
  onChange: (r: DateRange) => void
}) {
  const [preset, setPreset] = useState<Preset>("30d")
  const [custom, setCustom] = useState<DateRange>(range)

  function select(p: Preset) {
    setPreset(p)
    if (p !== "custom") onChange(presetRange(p))
    else onChange(custom)
  }

  function applyCustom() {
    if (custom.start && custom.end && custom.start <= custom.end) {
      onChange(custom)
    }
  }

  const today = toIso(new Date())

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "7d",    label: "Últimos 7 días" },
    { key: "30d",   label: "Últimos 30 días" },
    { key: "custom", label: "Rango personalizado" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => select(key)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            preset === key
              ? "bg-[#163b61] text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
          )}
        >
          {label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={custom.start}
            max={custom.end || today}
            onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163b61]"
          />
          <span className="text-sm text-slate-400">–</span>
          <input
            type="date"
            value={custom.end}
            min={custom.start}
            max={today}
            onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163b61]"
          />
          <button
            onClick={applyCustom}
            disabled={!custom.start || !custom.end || custom.start > custom.end}
            className="rounded-lg bg-[#163b61] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e4f82] disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Shared tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      {label && <p className="mb-1.5 text-xs font-semibold text-slate-600">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-sm tabular-nums" style={{ color: p.color }}>
          <span className="font-medium">{p.name}:</span>
          <span>{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── KPI strip ─────────────────────────────────────────────────────────────────
function KpiItem({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/70">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {value !== null ? (
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-800">{value}</p>
      ) : (
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
      )}
    </div>
  )
}

function KpiStrip({
  etapa, residencia, nacimiento, registros,
}: {
  etapa: PorEtapaSexoData | null
  residencia: PorResidenciaData | null
  nacimiento: PorNacimientoData | null
  registros: RegistrosMesData | null
}) {
  const total = etapa?.totales.total ?? null
  const pctNl = residencia
    ? `${Math.round((residencia.totales.nl / (residencia.totales.total || 1)) * 100)}%`
    : null
  const pctMex = nacimiento
    ? `${Math.round((nacimiento.totales.mexicanos / (nacimiento.totales.total || 1)) * 100)}%`
    : null
  const prom = registros?.promedio_anual ?? null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiItem label="Total sujetos de derecho" value={total} />
      <KpiItem label="% Viven en N.L." value={pctNl} />
      <KpiItem label="% Mexicanos" value={pctMex} />
      <KpiItem label="Prom. registros / mes" value={prom} />
    </div>
  )
}

// ── Skeleton / error ──────────────────────────────────────────────────────────
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-1.5">
      <div className="h-7 rounded bg-slate-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-6 rounded bg-slate-50" style={{ opacity: 1 - i * 0.1 }} />
      ))}
      <div className="h-7 rounded bg-slate-100" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse flex items-end gap-2 px-2" style={{ height: CHART_H }}>
      {[60, 90, 45, 75, 30, 50].map((h, i) => (
        <div key={i} className="flex-1 rounded-t bg-slate-100" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-slate-100" style={{ height: 380 }} />
  )
}

function CardError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-red-500">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ── Generic table ─────────────────────────────────────────────────────────────
interface TableProps {
  headers: string[]
  rows: { cells: (string | number)[]; dim?: boolean }[]
  totals?: (string | number)[]
}

function MetricTable({ headers, rows, totals }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100">
            {headers.map((h, i) => (
              <th key={i} className={cn("px-3 py-2 font-medium text-slate-600", i === 0 ? "text-left" : "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn("border-t border-slate-100", row.dim ? "text-slate-400" : "text-slate-700")}>
              {row.cells.map((cell, ci) => (
                <td key={ci} className={cn("px-3 py-1.5", ci === 0 ? "text-left" : "text-right tabular-nums", row.dim && "italic")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {totals && (
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              {totals.map((cell, ci) => (
                <td key={ci} className={cn("px-3 py-2 font-semibold text-slate-800", ci === 0 ? "text-left" : "text-right tabular-nums")}>
                  {cell}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Choropleth map ────────────────────────────────────────────────────────────

// blue-100 (#dbeafe = 219,234,254) → blue-800 (#1e40af = 30,64,175)
function interpolateBlue(count: number, max: number): string {
  if (count === 0) return "#e2e8f0" // slate-200: no data
  const t = Math.min(count / max, 1)
  const r = Math.round(219 - 189 * t)
  const g = Math.round(234 - 170 * t)
  const b = Math.round(254 - 79 * t)
  return `rgb(${r},${g},${b})`
}

function normEstado(s: string): string {
  return s
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

// Maps common DB state name variants to the canonical normalized form used in the TopoJSON
const ESTADO_ALIASES: Record<string, string> = {
  "nl": "nuevo leon",
  "n.l.": "nuevo leon",
  "df": "distrito federal",
  "cdmx": "ciudad de mexico",
  "coahuila de zaragoza": "coahuila",
  "michoacan de ocampo": "michoacan",
  "veracruz de ignacio de la llave": "veracruz",
  "estado de mexico": "mexico",
  "queretaro de arteaga": "queretaro",
  "queretaro": "queretaro",
}

function resolveEstado(name: string): string {
  const n = normEstado(name)
  return ESTADO_ALIASES[n] ?? n
}

const GEO_URL = "/geo/mexico-states.json"

interface MapTooltip {
  name: string
  total: number
  pct: number
  x: number
  y: number
}

function MapaEstados({ data }: { data: PorEstadoData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null)
  const [focusedInfo, setFocusedInfo] = useState<Omit<MapTooltip, "x" | "y"> | null>(null)

  const lookup = new Map<string, number>()
  for (const f of data.filas) {
    if (f.estado !== "Sin estado") {
      lookup.set(resolveEstado(f.estado), f.total)
    }
  }

  const max = Math.max(...Array.from(lookup.values()), 1)

  function getCount(topoName: string | null): number {
    if (!topoName) return 0
    return lookup.get(resolveEstado(topoName)) ?? 0
  }

  function getPct(count: number): number {
    return data.total_nacional > 0 ? Math.round((count / data.total_nacional) * 100) : 0
  }

  function handleMouseMove(e: React.MouseEvent<SVGPathElement>, name: string, count: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      name,
      total: count,
      pct: getPct(count),
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 12,
    })
  }

  return (
    <div>
      <div ref={containerRef} className="relative select-none">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1050, center: [-102, 24] }}
          style={{ width: "100%", height: "auto" }}
          width={900}
          height={520}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.name ?? ""
                const count = getCount(name)
                const pct = getPct(count)
                const fill = interpolateBlue(count, max)
                const ariaLabel = name
                  ? `${name}: ${count} sujetos (${pct}% del total nacional)`
                  : "Estado no identificado"

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.6}
                    aria-label={ariaLabel}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        opacity: 0.78,
                        cursor: "pointer",
                        stroke: "#1e40af",
                        strokeWidth: "1",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseMove={(e) => {
                      if (name) handleMouseMove(e as unknown as React.MouseEvent<SVGPathElement>, name, count)
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={() => {
                      if (name) setFocusedInfo({ name, total: count, pct: getPct(count) })
                    }}
                    onBlur={() => setFocusedInfo(null)}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Mouse tooltip */}
        {tooltip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(0, -100%)",
              maxWidth: 200,
            }}
          >
            <p className="text-sm font-semibold text-slate-800">{tooltip.name}</p>
            <p className="mt-0.5 text-sm tabular-nums text-slate-600">
              {tooltip.total.toLocaleString("es-MX")} sujetos
            </p>
            <p className="text-xs text-slate-400">{tooltip.pct}% del total nacional</p>
          </div>
        )}
      </div>

      {/* Keyboard focus info strip */}
      <div className="mt-1 h-5" aria-live="polite" aria-atomic="true">
        {focusedInfo && (
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{focusedInfo.name}:</span>{" "}
            {focusedInfo.total.toLocaleString("es-MX")} sujetos · {focusedInfo.pct}% del total nacional
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded" style={{ background: "#e2e8f0" }} />
          <span>Sin datos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>1</span>
          <div
            className="h-3 w-28 rounded"
            style={{ background: "linear-gradient(to right, #dbeafe, #1e40af)" }}
          />
          <span>{max.toLocaleString("es-MX")}</span>
        </div>
      </div>
    </div>
  )
}

// ── Charts ────────────────────────────────────────────────────────────────────

function CurpChart({ data }: { data: PorCurpData }) {
  const rows = toChartRows(data.filas)
  return (
    <div aria-label="Gráfica de CURP N.L. vs foráneos por etapa de vida">
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="curp_nl"    name="CURP N.L."     fill={CP} radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={600} />
          <Bar dataKey="curp_foraneo" name="CURP Foráneos" fill={CN} radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ResidenciaChart({ data }: { data: PorResidenciaData }) {
  const rows = toChartRows(data.filas)
  return (
    <div aria-label="Gráfica de residencia N.L. vs otros estados por etapa de vida">
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="nl"    name="Viven en N.L."    fill={CP} stackId="s" isAnimationActive={true} animationDuration={600} />
          <Bar dataKey="otros" name="Viven otros Edos." fill={CN} stackId="s" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function NacimientoChart({ data }: { data: PorNacimientoData }) {
  const items = [
    { name: "Mexicanos",   value: data.totales.mexicanos,  fill: CP },
    { name: "Extranjeros", value: data.totales.extranjeros, fill: CN },
  ]
  const pctMex = data.totales.total
    ? Math.round((data.totales.mexicanos / data.totales.total) * 100)
    : 0
  return (
    <div aria-label="Gráfica de distribución de nacimiento: mexicanos vs extranjeros">
      <ResponsiveContainer width="100%" height={CHART_H}>
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={items}
            cx="50%" cy="45%"
            innerRadius={64} outerRadius={92}
            dataKey="value"
            paddingAngle={3}
            isAnimationActive={true}
            animationDuration={600}
          >
            {items.map((entry, i) => (
              <Cell key={i} fill={entry.fill} stroke="none" />
            ))}
            <Label
              value={`${pctMex}%`}
              position="center"
              style={{ fontSize: 22, fontWeight: 600, fill: "#1e293b" }}
            />
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function SexoChart({ data, ariaLabel }: { data: PorEtapaSexoData; ariaLabel: string }) {
  const rows = toChartRows(data.filas)
  return (
    <div aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="mujer"  name="Mujeres"  fill={CP} radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={600} />
          <Bar dataKey="hombre" name="Hombres"  fill={CA} radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MesChart({ data }: { data: RegistrosMesData }) {
  const years = new Set(data.filas.map((f) => f.mes.slice(0, 4)))
  const multiYear = years.size > 1
  const rows = data.filas.map((f) => {
    const [y, m] = f.mes.split("-").map(Number)
    const d = new Date(y, m - 1, 1)
    const label = multiYear
      ? d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
      : d.toLocaleDateString("es-MX", { month: "short" })
    return { ...f, label }
  })
  return (
    <div aria-label={`Gráfica de registros por mes ${data.anio}`}>
      <ResponsiveContainer width="100%" height={CHART_H}>
        <LineChart data={rows} margin={{ top: 8, right: 24, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0" }} />
          <ReferenceLine
            y={data.promedio_anual}
            stroke={CN}
            strokeDasharray="5 3"
            label={{ value: `Prom: ${data.promedio_anual}`, position: "insideTopRight", fontSize: 10, fill: CN }}
          />
          <Line
            type="monotone"
            dataKey="registros"
            name="Registros"
            stroke={CP}
            strokeWidth={2}
            dot={{ r: 3, fill: CP, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={true}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Card with chart/table toggle ──────────────────────────────────────────────
function MetricCard({
  title, loading, error, chart, table,
}: {
  title: string
  loading: boolean
  error: string | null
  chart: React.ReactNode
  table: React.ReactNode
}) {
  const [view, setView] = useState<"chart" | "table">("chart")

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
        {!loading && !error && (
          <button
            onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={view === "chart" ? "Ver tabla" : "Ver gráfica"}
          >
            {view === "chart" ? (
              <><Table2 className="h-3.5 w-3.5" /> Tabla</>
            ) : (
              <><BarChart3 className="h-3.5 w-3.5" /> Gráfica</>
            )}
          </button>
        )}
      </div>

      {loading ? (
        view === "chart" ? <ChartSkeleton /> : <TableSkeleton />
      ) : error ? (
        <CardError message={error} />
      ) : view === "chart" ? (
        chart
      ) : (
        table
      )}
    </div>
  )
}

// ── Per-metric hook ───────────────────────────────────────────────────────────
function useMetrica<T>(endpoint: string, authorized: boolean, range: DateRange) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authorized) { setLoading(false); return }
    setLoading(true)
    setData(null)
    setError(null)
    const url = `${endpoint}?startDate=${range.start}&endDate=${range.end}`
    fetch(url)
      .then((r) => r.json())
      .then((d: T & { error?: string }) => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError("Error de conexión"); setLoading(false) })
  }, [authorized, endpoint, range.start, range.end])

  return { data, error, loading }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MetricasPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(presetRange("30d"))

  useEffect(() => {
    getSession().then((s) => setAuthorized(!!s))
  }, [])

  const porCurp       = useMetrica<PorCurpData>("/api/metricas/por-curp",          !!authorized, dateRange)
  const porResidencia = useMetrica<PorResidenciaData>("/api/metricas/por-residencia", !!authorized, dateRange)
  const porNacimiento = useMetrica<PorNacimientoData>("/api/metricas/por-nacimiento", !!authorized, dateRange)
  const porEtapa      = useMetrica<PorEtapaSexoData>("/api/metricas/por-etapa",     !!authorized, dateRange)
  const curpNl        = useMetrica<PorEtapaSexoData>("/api/metricas/curp-nl",       !!authorized, dateRange)
  const curpForaneo   = useMetrica<PorEtapaSexoData>("/api/metricas/curp-foraneo",  !!authorized, dateRange)
  const registrosMes  = useMetrica<RegistrosMesData>("/api/metricas/registros-mes", !!authorized, dateRange)
  const porEstado     = useMetrica<PorEstadoData>("/api/metricas/por-estado",       !!authorized, dateRange)

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }
  if (!authorized) {
    return <div className="flex items-center justify-center py-32 text-slate-500">No autorizado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Métricas</h1>
          <p className="mt-1 text-sm text-slate-500">Sujetos de derecho — resumen estadístico</p>
        </div>
        <GenerarReporteButton />
      </div>

      {/* Date range picker */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Intervalo de tiempo
        </p>
        <DateRangePicker range={dateRange} onChange={setDateRange} />
      </div>

      {/* Choropleth map — main visual */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Distribución geográfica
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Sujetos de derecho por estado de residencia
          </p>
        </div>
        {porEstado.loading ? (
          <MapSkeleton />
        ) : porEstado.error ? (
          <CardError message={porEstado.error} />
        ) : porEstado.data ? (
          <MapaEstados data={porEstado.data} />
        ) : null}
      </div>

      {/* KPI strip */}
      <KpiStrip
        etapa={porEtapa.data}
        residencia={porResidencia.data}
        nacimiento={porNacimiento.data}
        registros={registrosMes.data}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

        {/* M1 — Por CURP */}
        <MetricCard
          title="Sujetos de derecho por CURP"
          loading={porCurp.loading} error={porCurp.error}
          chart={porCurp.data ? <CurpChart data={porCurp.data} /> : null}
          table={porCurp.data ? (
            <MetricTable
              headers={["Etapa de vida", "CURP N.L.", "CURP Foráneos", "Total"]}
              rows={porCurp.data.filas.map((f) => ({ cells: [f.etapa, f.curp_nl, f.curp_foraneo, f.total], dim: f.etapa === "Sin clasificar" }))}
              totals={["Total", porCurp.data.totales.curp_nl, porCurp.data.totales.curp_foraneo, porCurp.data.totales.total]}
            />
          ) : null}
        />

        {/* M2 — Por residencia */}
        <MetricCard
          title="Sujetos de derecho por lugar de residencia"
          loading={porResidencia.loading} error={porResidencia.error}
          chart={porResidencia.data ? <ResidenciaChart data={porResidencia.data} /> : null}
          table={porResidencia.data ? (
            <MetricTable
              headers={["Etapa de vida", "Viven en N.L.", "Viven otros Edos.", "Total"]}
              rows={porResidencia.data.filas.map((f) => ({ cells: [f.etapa, f.nl, f.otros, f.total], dim: f.etapa === "Sin clasificar" }))}
              totals={["Total", porResidencia.data.totales.nl, porResidencia.data.totales.otros, porResidencia.data.totales.total]}
            />
          ) : null}
        />

        {/* M3 — Por nacimiento */}
        <MetricCard
          title="Sujetos de derecho por nacimiento"
          loading={porNacimiento.loading} error={porNacimiento.error}
          chart={porNacimiento.data ? <NacimientoChart data={porNacimiento.data} /> : null}
          table={porNacimiento.data ? (
            <MetricTable
              headers={["Etapa de vida", "Mexicanos", "Nac. Extranj.", "Total"]}
              rows={porNacimiento.data.filas.map((f) => ({ cells: [f.etapa, f.mexicanos, f.extranjeros, f.total], dim: f.etapa === "Sin clasificar" }))}
              totals={["Total", porNacimiento.data.totales.mexicanos, porNacimiento.data.totales.extranjeros, porNacimiento.data.totales.total]}
            />
          ) : null}
        />

        {/* M4 — Por etapa de vida */}
        <MetricCard
          title="Sujetos de derecho por etapa de vida"
          loading={porEtapa.loading} error={porEtapa.error}
          chart={porEtapa.data ? <SexoChart data={porEtapa.data} ariaLabel="Gráfica de sujetos de derecho por etapa de vida y sexo" /> : null}
          table={porEtapa.data ? (
            <MetricTable
              headers={["Etapa de vida", "Total", "M", "H"]}
              rows={porEtapa.data.filas.map((f) => ({ cells: [f.etapa, f.total, f.mujer, f.hombre], dim: f.etapa === "Sin clasificar" }))}
              totals={["Total", porEtapa.data.totales.total, porEtapa.data.totales.mujer, porEtapa.data.totales.hombre]}
            />
          ) : null}
        />

        {/* M5 — CURP N.L. */}
        <MetricCard
          title="Sujetos de derecho por CURP N.L."
          loading={curpNl.loading} error={curpNl.error}
          chart={curpNl.data ? <SexoChart data={curpNl.data} ariaLabel="Gráfica de sujetos con CURP N.L. por etapa y sexo" /> : null}
          table={curpNl.data ? (
            <MetricTable
              headers={["Etapa de vida", "Total", "M", "H"]}
              rows={curpNl.data.filas.map((f) => ({ cells: [f.etapa, f.total, f.mujer, f.hombre], dim: f.etapa === "Sin clasificar" }))}
              totals={["Total", curpNl.data.totales.total, curpNl.data.totales.mujer, curpNl.data.totales.hombre]}
            />
          ) : null}
        />

        {/* M6 — CURP foráneos */}
        <MetricCard
          title="Sujetos de derecho foráneos"
          loading={curpForaneo.loading} error={curpForaneo.error}
          chart={curpForaneo.data ? <SexoChart data={curpForaneo.data} ariaLabel="Gráfica de sujetos con CURP foráneo por etapa y sexo" /> : null}
          table={curpForaneo.data ? (
            <MetricTable
              headers={["Etapa de vida", "Total", "M", "H"]}
              rows={curpForaneo.data.filas.map((f) => ({ cells: [f.etapa, f.total, f.mujer, f.hombre], dim: f.etapa === "Sin clasificar" }))}
              totals={["Total", curpForaneo.data.totales.total, curpForaneo.data.totales.mujer, curpForaneo.data.totales.hombre]}
            />
          ) : null}
        />

        {/* M7 — Registros por mes */}
        <MetricCard
          title={`Registros por mes${registrosMes.data ? ` (${registrosMes.data.anio})` : ""}`}
          loading={registrosMes.loading} error={registrosMes.error}
          chart={registrosMes.data ? <MesChart data={registrosMes.data} /> : null}
          table={registrosMes.data ? (
            <MetricTable
              headers={["Mes", "Registros"]}
              rows={registrosMes.data.filas.map((f) => ({
                cells: [
                  new Date(Number(f.mes.split("-")[0]), Number(f.mes.split("-")[1]) - 1, 1)
                    .toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
                  f.registros,
                ],
              }))}
              totals={["Promedio mensual", registrosMes.data.promedio_anual]}
            />
          ) : null}
        />

      </div>
    </div>
  )
}
