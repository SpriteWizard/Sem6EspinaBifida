"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"

import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { NuevaConsultaModal } from "../components/NuevaConsultaModal"
import { NuevoEstudioModal } from "../components/NuevoEstudioModal"
import { LABORATORIOS, getLocalTimestamp, normalizeDateString } from "@/lib/servicios-utils"

interface Servicio {
  id: string
  tipo: "Consulta" | "Estudio"
  folio: string
  idAsociado: string
  asociado: string
  medico: string
  laboratorio?: string
  fecha: string
  fecha_creacion: string
  fechaOrden: number
  estatus: "Pendiente" | "En proceso" | "Completado" | "Cancelado"
}

interface ServicioFilters {
  folio: string
  tipo: string
  asociado: string
  medico: string
  laboratorio: string
  fecha: string
  estatus: string
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

function mapServicioFromApi(raw: any): Servicio {
  const rawFechaConsulta =
    raw.fecha ?? raw.FECHA ?? raw.fecha_cita ?? raw.fecha_creacion ?? raw.fechaCreacion ?? raw.fechacreacion ?? raw.FECHA_CREACION
  const rawFechaCreacionEstudio =
    raw.fecha_creacion ?? raw.fechaCreacion ?? raw.fechacreacion ?? raw.FECHA_CREACION
  const rawFecha =
    raw.tipo_servicio === "Consulta" ? rawFechaConsulta : rawFechaCreacionEstudio
  const rawFechaFallback = rawFecha ?? raw.fecha ?? raw.FECHA ?? ""
  const date = normalizeDateString(rawFechaFallback)
  const parsedFecha = getLocalTimestamp(rawFechaFallback)

  return {
    id:
      raw.tipo_servicio === "Consulta"
        ? raw.id_consulta
        : raw.id_estudio,
    tipo: raw.tipo_servicio,
    folio:
      raw.tipo_servicio === "Consulta"
        ? "CON-" + String(raw.id_consulta)
        : "EST-" + String(raw.id_estudio),
    idAsociado: raw.asociado,
    asociado: `${raw.nombre_asociado ?? ""} ${raw.apellidos_asociado ?? ""}`.trim(),
    medico: raw.medico ? `Dr. ${raw.medico}` : "—",
    laboratorio: raw.tipo_servicio !== "Consulta" ? raw.laboratorio : undefined,
    fecha: date,
    fechaOrden: Number.isNaN(parsedFecha) ? 0 : parsedFecha,
    fecha_creacion: normalizeDateString(raw.fecha_creacion ?? ""),
    estatus: raw.estatus,
  }
}

function useServicios(endpoint: string, filters: ServicioFilters) {
  const SERVICIOS_PAGE_SIZE = 5
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryKey = useMemo(() => JSON.stringify(filters), [filters])

  function buildParams(cursor: string | null) {
    const params = new URLSearchParams()
    if (cursor) params.set("cursor", cursor)
    params.set("limit", String(SERVICIOS_PAGE_SIZE))
    if (filters.folio) params.set("folio", filters.folio)
    if (filters.tipo) params.set("tipo", filters.tipo)
    if (filters.asociado) params.set("asociado", filters.asociado)
    if (filters.medico) params.set("medico", filters.medico)
    if (filters.laboratorio) params.set("laboratorio", filters.laboratorio)
    if (filters.fecha) params.set("fecha", filters.fecha)
    if (filters.estatus) params.set("estatus", filters.estatus)
    return params
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    const fetchServicios = async () => {
      try {
        const params = buildParams(null)
        const res = await fetch(`${endpoint}?${params.toString()}`)
        if (!res.ok) throw new Error()

        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : data?.servicios ?? []
        const listaServicios = items.map(mapServicioFromApi)

        if (!alive) return
        setServicios(listaServicios)
        setNextCursor(data?.nextCursor ?? null)
      } catch {
        if (!alive) return
        setError("No se pudo cargar los servicios.")
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    fetchServicios()

    return () => {
      alive = false
    }
  }, [endpoint, queryKey])

  async function onLoadMore() {
    if (!nextCursor) return
    setLoadingMore(true)

    try {
      const params = buildParams(nextCursor)
      const res = await fetch(`${endpoint}?${params.toString()}`)
      if (!res.ok) throw new Error()

      const data = await res.json()
      const items = Array.isArray(data?.items) ? data.items : data?.servicios ?? []
      const listaServicios = items.map(mapServicioFromApi)
      setServicios((prev) => [...prev, ...listaServicios])
      setNextCursor(data?.nextCursor ?? null)
    } catch {
      setError("No se pudo cargar más datos.")
    } finally {
      setLoadingMore(false)
    }
  }

  return { servicios, nextCursor, loading, loadingMore, error, onLoadMore }
}

const ESTATUS_CLASSES: Record<Servicio["estatus"], string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Completado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-rose-100 text-rose-800",
}

function ServiciosTable({
  servicios,
  loading,
  error,
  onRowClick,
  selectedType,
}: {
  servicios: Servicio[]
  loading: boolean
  error: string | null
  onRowClick: (s: Servicio) => void
  selectedType: "Consulta" | "Estudio"
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse">
        <thead>
          <tr className="bg-slate-600 text-white">
            <th className="rounded-tl-2xl px-4 py-4 text-left text-sm font-semibold">Folio</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Asociado</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              {selectedType === "Consulta" ? "Médico" : "Laboratorio"}
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              {selectedType === "Consulta" ? "Fecha" : "Fecha de Creacion"}
            </th>
            <th className="rounded-tr-2xl px-4 py-4 text-left text-sm font-semibold">
              Estatus
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                Cargando…
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td className="px-4 py-6 text-sm text-rose-700" colSpan={5}>
                {error}
              </td>
            </tr>
          ) : servicios.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                Sin resultados.
              </td>
            </tr>
          ) : (
            servicios.map((s) => (
              <tr
                key={s.folio}
                onClick={() => onRowClick(s)}
                className="cursor-pointer transition hover:bg-slate-50"
              >
                <td className="px-4 py-5 text-sm font-medium text-slate-800">
                  {s.folio}
                </td>
                <td className="px-4 py-5 text-sm">
                  <span className="block font-medium text-slate-800">{s.asociado}</span>
                  <span className="block text-xs text-slate-400">{s.idAsociado}</span>
                </td>
                <td className="px-4 py-5 text-sm text-slate-700">
                  {s.tipo === "Consulta"
                    ? s.medico
                    : (LABORATORIOS[s.laboratorio ?? ""] ?? s.laboratorio ?? "—")}
                </td>
                <td className="px-4 py-5 text-sm text-slate-700">{s.fecha}</td>
                <td className="px-4 py-5 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${ESTATUS_CLASSES[s.estatus]}`}
                  >
                    {s.estatus}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function ServiciosPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<"Consulta" | "Estudio">("Consulta")
  const [folio, setFolio] = useState("")
  const [asociado, setAsociado] = useState("")
  const [medico, setMedico] = useState("Todos")
  const [laboratorio, setLaboratorio] = useState("Todos")
  const [fecha, setFecha] = useState("")
  const [estatus, setEstatus] = useState("Todos")
  const [nuevaConsultaOpen, setNuevaConsultaOpen] = useState(false)
  const [nuevoEstudioOpen, setNuevoEstudioOpen] = useState(false)

  const closeNuevaConsulta = useCallback(() => setNuevaConsultaOpen(false), [])
  const closeNuevoEstudio = useCallback(() => setNuevoEstudioOpen(false), [])

  const debouncedFolio = useDebouncedValue(folio, 400)
  const debouncedAsociado = useDebouncedValue(asociado, 400)

  const filtrosParaApi: ServicioFilters = useMemo(
    () => ({
      folio: debouncedFolio,
      tipo: selectedType,
      asociado: debouncedAsociado,
      medico,
      laboratorio,
      fecha,
      estatus,
    }),
    [debouncedFolio, selectedType, debouncedAsociado, medico, laboratorio, fecha, estatus],
  )

  const endpoint =
    selectedType === "Consulta"
      ? "/api/servicios/obtener/consultas"
      : "/api/servicios/obtener/estudios"

  const { servicios, nextCursor, loading, loadingMore, error, onLoadMore } =
    useServicios(endpoint, filtrosParaApi)

  const [allMedicos, setAllMedicos] = useState<string[]>([])

  useEffect(() => {
    const fetchAllMedicos = async () => {
      try {
        const params = new URLSearchParams()
        params.set("limit", "1000")
        params.set("tipo", selectedType)
        const res = await fetch(`${endpoint}?${params.toString()}`)
        if (!res.ok) throw new Error()

        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : data?.servicios ?? []
        const uniqueMedicos = [...new Set(items.map((item: any) => item.medico ?? "").filter(Boolean))]
        setAllMedicos((uniqueMedicos.sort().map((m) => {return String(m)})))
      } catch {
        setAllMedicos([])
      }
    }

    fetchAllMedicos()
  }, [endpoint, selectedType])

  const medicoOptions = allMedicos

  const hasActiveFilters =
    folio !== "" ||
    asociado !== "" ||
    medico !== "Todos" ||
    laboratorio !== "Todos" ||
    fecha !== "" ||
    estatus !== "Todos"

  function clearFilters() {
    setFolio("")
    setAsociado("")
    setMedico("Todos")
    setLaboratorio("Todos")
    setFecha("")
    setEstatus("Todos")
  }

  function handleRowClick(s: Servicio) {
    const ruta =
      s.tipo === "Consulta"
        ? `/servicios/${s.id}/detalle-consulta`
        : `/servicios/${s.id}/detalle-estudio`
    router.push(ruta)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
            Servicios
          </h1>
        </div>

          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() =>
              selectedType === "Consulta"
                ? setNuevaConsultaOpen(true)
                : setNuevoEstudioOpen(true)
            }
          >
            Nuevo {selectedType.toLowerCase()}
          </Button>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-min">
        {(["Consulta", "Estudio"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              selectedType === type
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70">
        {hasActiveFilters && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-800"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* First row: Asociado and ID - 2 filters taking up full width */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={asociado}
              onChange={(e) => setAsociado(e.target.value)}
              placeholder="Buscar por nombre de asociado..."
              aria-label="Buscar por nombre de asociado"
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder={selectedType === "Consulta" ? "Buscar por ID consulta..." : "Buscar por ID estudio..."}
              aria-label={selectedType === "Consulta" ? "Buscar por ID consulta" : "Buscar por ID estudio"}
              className="pl-9"
            />
          </div>

          {/* Second row: 3 filters */}
          {selectedType === "Consulta" ? (
            <>
              <div className="relative md:col-span-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Select
                      value={medico}
                      onChange={(e) => setMedico(e.target.value)}
                      aria-label="Filtrar por médico"
                    >
                      <option value="Todos">Todos los médicos</option>
                      {medicoOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </span>
                  </div>

                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    aria-label="Filtrar por fecha"
                  />

                  <div className="relative">
                    <Select
                      value={estatus}
                      onChange={(e) => setEstatus(e.target.value)}
                      aria-label="Filtrar por estatus"
                    >
                      <option value="Todos">Todos los estatus</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Completado">Completado</option>
                      <option value="Cancelado">Cancelado</option>
                    </Select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative md:col-span-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative">
                    <Select
                      value={laboratorio}
                      onChange={(e) => setLaboratorio(e.target.value)}
                      aria-label="Filtrar por laboratorio"
                    >
                      <option value="Todos">Todos los laboratorios</option>
                      {Object.entries(LABORATORIOS).map(([id, nombre]) => (
                        <option key={id} value={nombre}>
                          {nombre}
                        </option>
                      ))}
                    </Select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </span>
                  </div>

                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    aria-label="Filtrar por fecha"
                  />

                  <div className="relative">
                    <Select
                      value={estatus}
                      onChange={(e) => setEstatus(e.target.value)}
                      aria-label="Filtrar por estatus"
                    >
                      <option value="Todos">Todos los estatus</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Completado">Completado</option>
                      <option value="Cancelado">Cancelado</option>
                    </Select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ServiciosTable
          servicios={servicios}
          loading={loading}
          error={error}
          onRowClick={handleRowClick}
                  selectedType={selectedType}
        />
        <div className="flex justify-center p-5">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={!nextCursor || loading || loadingMore}
          >
            {loadingMore ? "Cargando…" : "Cargar más datos"}
          </Button>
        </div>
      </div>

      <NuevaConsultaModal
        open={nuevaConsultaOpen}
        onClose={closeNuevaConsulta}
      />
      <NuevoEstudioModal
        open={nuevoEstudioOpen}
        onClose={closeNuevoEstudio}
      />
    </div>
  )
}
