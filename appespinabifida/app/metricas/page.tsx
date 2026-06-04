"use client"

import { useEffect, useRef, useState } from "react"
import { getSession } from "next-auth/react"
import {
  AlertTriangle, Baby, BarChart3, CalendarDays,
  Loader2, MapPin, Scale, Table2, TrendingUp,
  UserPlus, Users,
} from "lucide-react"
import {
  Bar, BarChart, CartesianGrid,
  Legend, Line, LineChart,
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
const CP = "#3b82f6"
const CN = "#94a3b8"
const CA = "#f59e0b"
const AXIS = { fontSize: 11, fill: "#94a3b8" }
const GRID = "#f1f5f9"
const CHART_H = 260

// ── Shared chart config ───────────────────────────────────────────────────────
const CHART_MARGIN = { top: 8, right: 8, left: -22, bottom: 0 }
const BAR_GAP = "28%"
const BAR_R: [number, number, number, number] = [3, 3, 0, 0]
const BAR_ANIM = { isAnimationActive: true as const, animationDuration: 600 }
const LEGEND = { iconType: "square" as const, iconSize: 10, wrapperStyle: { fontSize: 12, paddingTop: 8 } }

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
    if (custom.start && custom.end && custom.start <= custom.end) onChange(custom)
  }

  const today = toIso(new Date())
  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today",  label: "Hoy" },
    { key: "7d",     label: "7 días" },
    { key: "30d",    label: "30 días" },
    { key: "custom", label: "Personalizado" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="flex gap-1.5">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => select(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
              preset === key
                ? "bg-[#163b61] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={custom.start}
            max={custom.end || today}
            onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163b61]/30"
          />
          <span className="text-slate-300">→</span>
          <input
            type="date"
            value={custom.end}
            min={custom.start}
            max={today}
            onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#163b61]/30"
          />
          <button
            onClick={applyCustom}
            disabled={!custom.start || !custom.end || custom.start > custom.end}
            className="rounded-full bg-[#163b61] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1e4f82] disabled:opacity-40"
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
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-md">
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

// ── KPI computation helpers ───────────────────────────────────────────────────
const PEDIATRIC_STAGES = ["Primera infancia", "Infancia", "Adolescencia"]

function computeKpis(
  porEtapa: PorEtapaSexoData | null,
  porCurp: PorCurpData | null,
  registrosMes: RegistrosMesData | null,
) {
  const total = porEtapa?.totales.total ?? null

  const nuevos = registrosMes
    ? registrosMes.filas.reduce((s, f) => s + f.registros, 0)
    : null

  const pct_pediatrico =
    porEtapa && porEtapa.totales.total > 0
      ? Math.round(
          (porEtapa.filas
            .filter((f) => PEDIATRIC_STAGES.includes(f.etapa))
            .reduce((s, f) => s + f.total, 0) /
            porEtapa.totales.total) *
            100,
        )
      : null

  const razon_mh =
    porEtapa && porEtapa.totales.hombre > 0
      ? (porEtapa.totales.mujer / porEtapa.totales.hombre).toFixed(1)
      : null

  const pct_foraneo =
    porCurp && porCurp.totales.total > 0
      ? Math.round((porCurp.totales.curp_foraneo / porCurp.totales.total) * 100)
      : null

  const etapa_prevalente =
    porEtapa
      ? (() => {
          const valid = porEtapa.filas.filter((f) => f.etapa !== "Sin clasificar")
          if (!valid.length) return null
          const top = valid.reduce((a, b) => (b.total > a.total ? b : a))
          const pct =
            porEtapa.totales.total > 0
              ? Math.round((top.total / porEtapa.totales.total) * 100)
              : 0
          return { etapa: top.etapa as string, pct }
        })()
      : null

  return { total, nuevos, pct_pediatrico, razon_mh, pct_foraneo, etapa_prevalente }
}

// ── KPI card ──────────────────────────────────────────────────────────────────
type AccentKey = "indigo" | "emerald" | "violet" | "amber" | "sky" | "rose"

const ACCENT: Record<AccentKey, { bg: string; text: string; strip: string }> = {
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  strip: "bg-indigo-400" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", strip: "bg-emerald-400" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  strip: "bg-violet-400" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   strip: "bg-amber-400" },
  sky:     { bg: "bg-sky-50",     text: "text-sky-600",     strip: "bg-sky-400" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-600",    strip: "bg-rose-400" },
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  value: string | number | null
  label: string
  subtext: string
  accent: AccentKey
}

function KpiCard({ icon: Icon, value, label, subtext, accent }: KpiCardProps) {
  const { bg, text } = ACCENT[accent]
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className={cn("mb-3 inline-flex rounded-xl p-2.5", bg)}>
        <Icon className={cn("h-5 w-5", text)} />
      </div>
      {value !== null ? (
        <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      ) : (
        <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
      )}
      <p className="mt-1.5 text-sm font-semibold text-slate-700">{label}</p>
      {value !== null ? (
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{subtext}</p>
      ) : (
        <div className="mt-1 h-3 w-28 animate-pulse rounded bg-slate-100" />
      )}
    </div>
  )
}

function KpiStrip({
  porEtapa,
  porCurp,
  registrosMes,
}: {
  porEtapa: PorEtapaSexoData | null
  porCurp: PorCurpData | null
  registrosMes: RegistrosMesData | null
}) {
  const { total, nuevos, pct_pediatrico, razon_mh, pct_foraneo, etapa_prevalente } =
    computeKpis(porEtapa, porCurp, registrosMes)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        icon={Users}
        value={total !== null ? total.toLocaleString("es-MX") : null}
        label="Total registrados"
        subtext="Sujetos de derecho en el padrón"
        accent="indigo"
      />
      <KpiCard
        icon={UserPlus}
        value={nuevos !== null ? nuevos.toLocaleString("es-MX") : null}
        label="Nuevos en el período"
        subtext="Registros en el intervalo seleccionado"
        accent="emerald"
      />
      <KpiCard
        icon={Baby}
        value={pct_pediatrico !== null ? `${pct_pediatrico}%` : null}
        label="Pacientes pediátricos"
        subtext="Menores de 18 años (0–17)"
        accent="violet"
      />
      <KpiCard
        icon={Scale}
        value={razon_mh !== null ? razon_mh : null}
        label="Razón M / H"
        subtext="Mujeres por cada hombre registrado"
        accent="amber"
      />
      <KpiCard
        icon={MapPin}
        value={pct_foraneo !== null ? `${pct_foraneo}%` : null}
        label="CURP foráneo"
        subtext="Sujetos originarios de otro estado"
        accent="sky"
      />
      <KpiCard
        icon={TrendingUp}
        value={etapa_prevalente?.etapa ?? null}
        label="Etapa más prevalente"
        subtext={etapa_prevalente ? `${etapa_prevalente.pct}% del padrón` : "Etapa con mayor concentración"}
        accent="rose"
      />
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="flex-1 border-t border-slate-200" />
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
  return <div className="animate-pulse rounded-xl bg-slate-100" style={{ height: 380 }} />
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
              <th
                key={i}
                className={cn(
                  "px-3 py-2 font-medium text-slate-600",
                  i === 0 ? "text-left" : "text-right",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={cn("border-t border-slate-100", row.dim ? "text-slate-400" : "text-slate-700")}
            >
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-3 py-1.5",
                    ci === 0 ? "text-left" : "text-right tabular-nums",
                    row.dim && "italic",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {totals && (
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              {totals.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-3 py-2 font-semibold text-slate-800",
                    ci === 0 ? "text-left" : "text-right tabular-nums",
                  )}
                >
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
function interpolateBlue(count: number, max: number): string {
  if (count === 0) return "#e2e8f0"
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

interface MapTooltip { name: string; total: number; pct: number; x: number; y: number }

function MapaEstados({ data }: { data: PorEstadoData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null)
  const [focusedInfo, setFocusedInfo] = useState<Omit<MapTooltip, "x" | "y"> | null>(null)
  // Track hovered state by resolved name so all sub-polygons of a state highlight together.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  // Small debounce prevents flicker when the cursor moves between sub-polygons of the same state.
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = new Map<string, number>()
  for (const f of data.filas) {
    if (f.estado !== "Sin estado") lookup.set(resolveEstado(f.estado), f.total)
  }
  const max = Math.max(...Array.from(lookup.values()), 1)

  function getCount(topoName: string | null) {
    if (!topoName) return 0
    return lookup.get(resolveEstado(topoName)) ?? 0
  }

  function getPct(count: number) {
    return data.total_nacional > 0 ? Math.round((count / data.total_nacional) * 100) : 0
  }

  function handleEnter(e: React.MouseEvent<SVGPathElement>, name: string, count: number) {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    setHoveredKey(resolveEstado(name))
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ name, total: count, pct: getPct(count), x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 12 })
  }

  function handleMove(e: React.MouseEvent<SVGPathElement>, name: string, count: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip((t) => t ? { ...t, x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 12 } : t)
  }

  function handleLeave() {
    leaveTimer.current = setTimeout(() => {
      setHoveredKey(null)
      setTooltip(null)
    }, 40)
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
          {/* Fill layer — all states, uniform white border */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.name ?? ""
                const key = resolveEstado(name)
                const count = getCount(name)
                const pct = getPct(count)
                const isHovered = !!name && key === hoveredKey
                const fill = interpolateBlue(count, max)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.6}
                    aria-label={name ? `${name}: ${count} sujetos (${pct}% del total nacional)` : "Estado no identificado"}
                    style={{
                      default: { outline: "none", opacity: isHovered ? 0.8 : 1, cursor: name ? "pointer" : "default" },
                      hover:   { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(e) => { if (name) handleEnter(e as unknown as React.MouseEvent<SVGPathElement>, name, count) }}
                    onMouseMove={(e)  => { if (name) handleMove(e as unknown as React.MouseEvent<SVGPathElement>, name, count) }}
                    onMouseLeave={handleLeave}
                    onFocus={() => { if (name) setFocusedInfo({ name, total: count, pct: getPct(count) }) }}
                    onBlur={() => setFocusedInfo(null)}
                  />
                )
              })
            }
          </Geographies>

          {/* Hover stroke layer — painted last so no fill ever occludes it */}
          {hoveredKey && (
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => resolveEstado(geo.properties.name ?? "") === hoveredKey)
                  .map((geo) => (
                    <Geography
                      key={`hl-${geo.rsmKey}`}
                      geography={geo}
                      fill="transparent"
                      stroke="#1e40af"
                      strokeWidth={1.5}
                      style={{
                        default: { outline: "none", pointerEvents: "none" },
                        hover:   { outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
              }
            </Geographies>
          )}
        </ComposableMap>
        {tooltip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-md"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(0, -100%)", maxWidth: 200 }}
          >
            <p className="text-sm font-semibold text-slate-800">{tooltip.name}</p>
            <p className="mt-0.5 text-sm tabular-nums text-slate-600">
              {tooltip.total.toLocaleString("es-MX")} sujetos
            </p>
            <p className="text-xs text-slate-400">{tooltip.pct}% del total nacional</p>
          </div>
        )}
      </div>
      <div className="mt-1 h-5" aria-live="polite" aria-atomic="true">
        {focusedInfo && (
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{focusedInfo.name}:</span>{" "}
            {focusedInfo.total.toLocaleString("es-MX")} sujetos · {focusedInfo.pct}% del total nacional
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded" style={{ background: "#e2e8f0" }} />
          <span>Sin datos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>1</span>
          <div className="h-3 w-28 rounded" style={{ background: "linear-gradient(to right, #dbeafe, #1e40af)" }} />
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
    <div aria-label="CURP N.L. vs foráneos por etapa de vida">
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap={BAR_GAP}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend {...LEGEND} />
          <Bar dataKey="curp_nl"      name="CURP N.L."     fill={CP} radius={BAR_R} {...BAR_ANIM} />
          <Bar dataKey="curp_foraneo" name="CURP Foráneos" fill={CN} radius={BAR_R} {...BAR_ANIM} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ResidenciaChart({ data }: { data: PorResidenciaData }) {
  const rows = toChartRows(data.filas)
  return (
    <div aria-label="Residencia N.L. vs otros estados por etapa de vida">
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap={BAR_GAP}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend {...LEGEND} />
          <Bar dataKey="nl"    name="Viven en N.L."     fill={CP} radius={BAR_R} {...BAR_ANIM} />
          <Bar dataKey="otros" name="Viven otros Edos." fill={CN} radius={BAR_R} {...BAR_ANIM} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function NacimientoChart({ data }: { data: PorNacimientoData }) {
  const rows = toChartRows(data.filas)
  return (
    <div aria-label="Nacionalidad de nacimiento por etapa de vida">
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap={BAR_GAP}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend {...LEGEND} />
          <Bar dataKey="mexicanos"   name="Mexicanos"   fill={CP} radius={BAR_R} {...BAR_ANIM} />
          <Bar dataKey="extranjeros" name="Extranjeros" fill={CN} radius={BAR_R} {...BAR_ANIM} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SexoChart({ data, ariaLabel }: { data: PorEtapaSexoData; ariaLabel: string }) {
  const rows = toChartRows(data.filas)
  return (
    <div aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={CHART_H}>
        <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap={BAR_GAP}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend {...LEGEND} />
          <Bar dataKey="mujer"  name="Mujeres" fill={CP} radius={BAR_R} {...BAR_ANIM} />
          <Bar dataKey="hombre" name="Hombres" fill={CA} radius={BAR_R} {...BAR_ANIM} />
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
    <div aria-label={`Registros por mes ${data.anio}`}>
      <ResponsiveContainer width="100%" height={CHART_H}>
        <LineChart data={rows} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
          <Legend {...LEGEND} />
          <ReferenceLine
            y={data.promedio_anual}
            stroke={CN}
            strokeDasharray="5 3"
            label={{ value: `Prom: ${data.promedio_anual}`, position: "insideTopRight", fontSize: 10, fill: CN }}
          />
          <Line
            type="monotone" dataKey="registros" name="Registros"
            stroke={CP} strokeWidth={2}
            dot={{ r: 3, fill: CP, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            {...BAR_ANIM}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  title, summary, accent, loading, error, chart, table,
}: {
  title: string
  summary?: string | null
  accent: AccentKey
  loading: boolean
  error: string | null
  chart: React.ReactNode
  table: React.ReactNode
}) {
  const [view, setView] = useState<"chart" | "table">("chart")
  const { text, strip } = ACCENT[accent]

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      {/* accent strip */}
      <div className={cn("h-[3px] w-full shrink-0", strip)} />

      {/* header */}
      <div className="flex items-start gap-2 px-5 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold leading-snug text-slate-700">{title}</h2>
          {loading ? (
            <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-slate-100" />
          ) : summary ? (
            <p className={cn("mt-1 text-xs font-medium tabular-nums", text)}>{summary}</p>
          ) : null}
        </div>
        {!loading && !error && (
          <button
            onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
            className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
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

      {/* chart / table area */}
      <div className="flex-1 border-t border-slate-100 bg-slate-50/50 p-5">
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
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Métricas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Estadísticas del padrón · Espina Bífida N.L.
          </p>
        </div>
        <GenerarReporteButton />
      </div>

      {/* ── Date picker ── */}
      <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Período de análisis
        </p>
        <DateRangePicker range={dateRange} onChange={setDateRange} />
      </div>

      {/* ── Mapa ── */}
      <section aria-label="Distribución geográfica">
        <SectionLabel label="Distribución geográfica" />
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="h-[3px] w-full bg-indigo-400" />
          <div className="px-5 pt-4 pb-3.5">
            <p className="text-sm font-semibold text-slate-700">Por estado de residencia</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Sujetos de derecho registrados en cada entidad federativa
            </p>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 p-5">
            {porEstado.loading ? (
              <MapSkeleton />
            ) : porEstado.error ? (
              <CardError message={porEstado.error} />
            ) : porEstado.data ? (
              <MapaEstados data={porEstado.data} />
            ) : null}
          </div>
        </div>
      </section>

      {/* ── KPIs ── */}
      <section aria-label="Indicadores clave">
        <SectionLabel label="Indicadores clave" />
        <KpiStrip
          porEtapa={porEtapa.data}
          porCurp={porCurp.data}
          registrosMes={registrosMes.data}
        />
      </section>

      {/* ── Metric cards ── */}
      <section aria-label="Análisis detallado">
        <SectionLabel label="Análisis detallado" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          <MetricCard
            title="Tipo de CURP por etapa de vida"
            accent="sky"
            summary={porCurp.data
              ? `${porCurp.data.totales.curp_nl} N.L. · ${porCurp.data.totales.curp_foraneo} foráneos`
              : null}
            loading={porCurp.loading} error={porCurp.error}
            chart={porCurp.data ? <CurpChart data={porCurp.data} /> : null}
            table={porCurp.data ? (
              <MetricTable
                headers={["Etapa de vida", "CURP N.L.", "CURP Foráneos", "Total"]}
                rows={porCurp.data.filas.map((f) => ({
                  cells: [f.etapa, f.curp_nl, f.curp_foraneo, f.total],
                  dim: f.etapa === "Sin clasificar",
                }))}
                totals={["Total", porCurp.data.totales.curp_nl, porCurp.data.totales.curp_foraneo, porCurp.data.totales.total]}
              />
            ) : null}
          />

          <MetricCard
            title="Lugar de residencia por etapa de vida"
            accent="emerald"
            summary={porResidencia.data
              ? `${porResidencia.data.totales.nl} en N.L. · ${porResidencia.data.totales.otros} otros estados`
              : null}
            loading={porResidencia.loading} error={porResidencia.error}
            chart={porResidencia.data ? <ResidenciaChart data={porResidencia.data} /> : null}
            table={porResidencia.data ? (
              <MetricTable
                headers={["Etapa de vida", "Viven en N.L.", "Viven otros Edos.", "Total"]}
                rows={porResidencia.data.filas.map((f) => ({
                  cells: [f.etapa, f.nl, f.otros, f.total],
                  dim: f.etapa === "Sin clasificar",
                }))}
                totals={["Total", porResidencia.data.totales.nl, porResidencia.data.totales.otros, porResidencia.data.totales.total]}
              />
            ) : null}
          />

          <MetricCard
            title="Nacionalidad de nacimiento"
            accent="violet"
            summary={porNacimiento.data
              ? `${porNacimiento.data.totales.mexicanos} mexicanos · ${porNacimiento.data.totales.extranjeros} extranjeros`
              : null}
            loading={porNacimiento.loading} error={porNacimiento.error}
            chart={porNacimiento.data ? <NacimientoChart data={porNacimiento.data} /> : null}
            table={porNacimiento.data ? (
              <MetricTable
                headers={["Etapa de vida", "Mexicanos", "Nac. Extranj.", "Total"]}
                rows={porNacimiento.data.filas.map((f) => ({
                  cells: [f.etapa, f.mexicanos, f.extranjeros, f.total],
                  dim: f.etapa === "Sin clasificar",
                }))}
                totals={["Total", porNacimiento.data.totales.mexicanos, porNacimiento.data.totales.extranjeros, porNacimiento.data.totales.total]}
              />
            ) : null}
          />

          <MetricCard
            title="Distribución por etapa de vida y sexo"
            accent="amber"
            summary={porEtapa.data
              ? `${porEtapa.data.totales.total} total · ${porEtapa.data.totales.mujer} M · ${porEtapa.data.totales.hombre} H`
              : null}
            loading={porEtapa.loading} error={porEtapa.error}
            chart={porEtapa.data ? (
              <SexoChart data={porEtapa.data} ariaLabel="Sujetos de derecho por etapa de vida y sexo" />
            ) : null}
            table={porEtapa.data ? (
              <MetricTable
                headers={["Etapa de vida", "Total", "M", "H"]}
                rows={porEtapa.data.filas.map((f) => ({
                  cells: [f.etapa, f.total, f.mujer, f.hombre],
                  dim: f.etapa === "Sin clasificar",
                }))}
                totals={["Total", porEtapa.data.totales.total, porEtapa.data.totales.mujer, porEtapa.data.totales.hombre]}
              />
            ) : null}
          />

          <MetricCard
            title="CURP N.L. — etapa de vida y sexo"
            accent="indigo"
            summary={curpNl.data
              ? `${curpNl.data.totales.total} total · ${curpNl.data.totales.mujer} M · ${curpNl.data.totales.hombre} H`
              : null}
            loading={curpNl.loading} error={curpNl.error}
            chart={curpNl.data ? (
              <SexoChart data={curpNl.data} ariaLabel="Sujetos con CURP N.L. por etapa y sexo" />
            ) : null}
            table={curpNl.data ? (
              <MetricTable
                headers={["Etapa de vida", "Total", "M", "H"]}
                rows={curpNl.data.filas.map((f) => ({
                  cells: [f.etapa, f.total, f.mujer, f.hombre],
                  dim: f.etapa === "Sin clasificar",
                }))}
                totals={["Total", curpNl.data.totales.total, curpNl.data.totales.mujer, curpNl.data.totales.hombre]}
              />
            ) : null}
          />

          <MetricCard
            title="CURP foráneo — etapa de vida y sexo"
            accent="rose"
            summary={curpForaneo.data
              ? `${curpForaneo.data.totales.total} total · ${curpForaneo.data.totales.mujer} M · ${curpForaneo.data.totales.hombre} H`
              : null}
            loading={curpForaneo.loading} error={curpForaneo.error}
            chart={curpForaneo.data ? (
              <SexoChart data={curpForaneo.data} ariaLabel="Sujetos con CURP foráneo por etapa y sexo" />
            ) : null}
            table={curpForaneo.data ? (
              <MetricTable
                headers={["Etapa de vida", "Total", "M", "H"]}
                rows={curpForaneo.data.filas.map((f) => ({
                  cells: [f.etapa, f.total, f.mujer, f.hombre],
                  dim: f.etapa === "Sin clasificar",
                }))}
                totals={["Total", curpForaneo.data.totales.total, curpForaneo.data.totales.mujer, curpForaneo.data.totales.hombre]}
              />
            ) : null}
          />

          <MetricCard
            title={`Registros por mes${registrosMes.data ? ` · ${registrosMes.data.anio}` : ""}`}
            accent="emerald"
            summary={registrosMes.data
              ? `Promedio: ${registrosMes.data.promedio_anual} registros/mes`
              : null}
            loading={registrosMes.loading} error={registrosMes.error}
            chart={registrosMes.data ? <MesChart data={registrosMes.data} /> : null}
            table={registrosMes.data ? (
              <MetricTable
                headers={["Mes", "Registros"]}
                rows={registrosMes.data.filas.map((f) => ({
                  cells: [
                    new Date(
                      Number(f.mes.split("-")[0]),
                      Number(f.mes.split("-")[1]) - 1,
                      1,
                    ).toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
                    f.registros,
                  ],
                }))}
                totals={["Promedio mensual", registrosMes.data.promedio_anual]}
              />
            ) : null}
          />

        </div>
      </section>

    </div>
  )
}
