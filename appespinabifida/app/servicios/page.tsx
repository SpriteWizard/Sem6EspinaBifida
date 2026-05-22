"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { NuevaConsultaModal } from '../components/NuevaConsultaModal'
import { NuevoEstudioModal } from '../components/NuevoEstudioModal'
import { NuevoServicioModal } from '../components/NuevoServicioModal'
import { LABORATORIOS } from '@/lib/servicios-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Servicio {
  id: string
  tipo: 'Consulta' | 'Estudio'
  folio: string
  idAsociado: string
  asociado: string
  medico: string
  laboratorio?: string
  fecha: string
  estatus: 'Pendiente' | 'En proceso' | 'Completado' | 'Cancelado'
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function mapServicioFromApi(raw: any): Servicio {
  const [date, timeWithZ] = String(raw.fecha).split("T");
  const time = String(timeWithZ).replace("Z", "");

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
    asociado:
      raw.nombre_asociado +
      " " +
      raw.apellidos_asociado,
    medico: raw.medico,
    laboratorio: raw.tipo_servicio !== 'Consulta' ? raw.laboratorio : undefined,
    fecha: date,
    estatus: raw.estatus,
  };
}

function useServicios() {
  const [allServicios, setAllServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const fetchServicios = async () => {
      try {
        const res = await fetch("/api/servicios/obtener");
        if (!res.ok) throw new Error();

        const data = (await res.json()).servicios;
        const listaServicios = data.map(mapServicioFromApi);

        if (!alive) return;
        setAllServicios(listaServicios);
      } catch (error) {
        if (!alive) return;
        setError("No se pudo cargar los servicios.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchServicios();

    return () => {
      alive = false;
    };
  }, []);

  return { allServicios, loading, error }
}

// ─── Filtering ────────────────────────────────────────────────────────────────

interface ServicioFilters {
  folio: string
  tipo: string
  asociado: string
  medico: string
  laboratorio: string
  fecha: string
  estatus: string
}

function filterServicios(
  servicios: Servicio[],
  filters: ServicioFilters,
): Servicio[] {
  const folioTerm = String(filters.folio).toLowerCase().trim()
  const asociadoTerm = String(filters.asociado).toLowerCase().trim()
  return servicios.filter((s) => {
    if (folioTerm && !s.folio.toLowerCase().includes(folioTerm)) return false
    if (filters.tipo !== 'Todos' && s.tipo !== filters.tipo) return false
    if (
      asociadoTerm &&
      !s.asociado.toLowerCase().includes(asociadoTerm) &&
      !String(s.idAsociado).toLowerCase().includes(asociadoTerm)
    )
      return false
    if (filters.medico !== 'Todos' && s.medico !== filters.medico) return false
    if (filters.laboratorio !== 'Todos' && s.laboratorio !== filters.laboratorio) return false
    if (filters.fecha && s.fecha !== filters.fecha) return false
    if (filters.estatus !== 'Todos' && s.estatus !== filters.estatus)
      return false
    return true
  })
}

// ─── Badge class helpers ──────────────────────────────────────────────────────

const TIPO_CLASSES: Record<Servicio['tipo'], string> = {
  Consulta: 'bg-sky-100 text-sky-800',
  Estudio: 'bg-violet-100 text-violet-800',
}

const ESTATUS_CLASSES: Record<Servicio['estatus'], string> = {
  Pendiente: 'bg-amber-100 text-amber-800',
  'En proceso': 'bg-blue-100 text-blue-800',
  Completado: 'bg-emerald-100 text-emerald-800',
  Cancelado: 'bg-rose-100 text-rose-800',
}

// ─── Servicios Table ──────────────────────────────────────────────────────────

function ServiciosTable({
  servicios,
  loading,
  error,
  onRowClick,
}: {
  servicios: Servicio[]
  loading: boolean
  error: string | null
  onRowClick: (s: Servicio) => void
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse">
        <thead>
          <tr className="bg-slate-600 text-white">
            <th className="rounded-tl-2xl px-4 py-4 text-left text-sm font-semibold">
              Tipo
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Folio</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Asociado</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Médico / Lab.</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Fecha</th>
            <th className="rounded-tr-2xl px-4 py-4 text-left text-sm font-semibold">
              Estatus
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                Cargando…
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td className="px-4 py-6 text-sm text-rose-700" colSpan={6}>
                {error}
              </td>
            </tr>
          ) : servicios.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
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
                <td className="px-4 py-5 text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TIPO_CLASSES[s.tipo]}`}
                  >
                    {s.tipo}
                  </span>
                </td>
                <td className="px-4 py-5 text-sm font-medium text-slate-800">
                  {s.folio}
                </td>
                <td className="px-4 py-5 text-sm">
                  <span className="block font-medium text-slate-800">{s.asociado}</span>
                  <span className="block text-xs text-slate-400">{s.idAsociado}</span>
                </td>
                <td className="px-4 py-5 text-sm text-slate-700">
                  {s.tipo === 'Consulta'
                    ? s.medico
                    : (LABORATORIOS[s.laboratorio ?? ''] ?? s.laboratorio ?? '—')}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  const router = useRouter()
  const { allServicios, loading, error } = useServicios()

  const [folio, setFolio] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [asociado, setAsociado] = useState('')
  const [medico, setMedico] = useState('Todos')
  const [laboratorio, setLaboratorio] = useState('Todos')
  const [fecha, setFecha] = useState('')
  const [estatus, setEstatus] = useState('Todos')
  const [nuevoServicioOpen, setNuevoServicioOpen] = useState(false)
  const [nuevaConsultaOpen, setNuevaConsultaOpen] = useState(false)
  const [nuevoEstudioOpen, setNuevoEstudioOpen] = useState(false)

  const closeNuevaConsulta = useCallback(() => setNuevaConsultaOpen(false), [])
  const closeNuevoEstudio = useCallback(() => setNuevoEstudioOpen(false), [])

  const hasActiveFilters =
    folio !== '' ||
    tipo !== 'Todos' ||
    asociado !== '' ||
    medico !== 'Todos' ||
    laboratorio !== 'Todos' ||
    fecha !== '' ||
    estatus !== 'Todos'

  function clearFilters() {
    setFolio('')
    setTipo('Todos')
    setAsociado('')
    setMedico('Todos')
    setLaboratorio('Todos')
    setFecha('')
    setEstatus('Todos')
  }

  const debouncedFolio = useDebouncedValue(folio, 400)
  const debouncedAsociado = useDebouncedValue(asociado, 400)

  const medicoOptions = useMemo(
    () => [...new Set(allServicios.map((s) => s.medico))].sort(),
    [allServicios],
  )

  const filteredServicios = useMemo(
    () =>
      filterServicios(allServicios, {
        folio: debouncedFolio,
        tipo,
        asociado: debouncedAsociado,
        medico,
        laboratorio,
        fecha,
        estatus,
      }),
    [allServicios, debouncedFolio, tipo, debouncedAsociado, medico, laboratorio, fecha, estatus],
  )

  function handleRowClick(s: Servicio) {
    const ruta =
      s.tipo === 'Consulta'
        ? `/servicios/${s.id}/detalle-consulta`
        : `/servicios/${s.id}/detalle-estudio`
    router.push(ruta)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
          Servicios
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setNuevoServicioOpen(true)}
          >
            Nuevo servicio
          </Button>
        </div>
      </div>

      {/* Filters */}
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Folio — fila completa */}
          <div className="relative md:col-span-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Buscar por folio..."
              aria-label="Buscar por folio"
              className="pl-9"
            />
          </div>

          {/* Asociado */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={asociado}
              onChange={(e) => setAsociado(e.target.value)}
              placeholder="Nombre o ID de asociado..."
              aria-label="Buscar por nombre o ID de asociado"
              className="pl-9"
            />
          </div>

          {/* Tipo de servicio */}
          <div className="relative">
            <Select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              aria-label="Filtrar por tipo de servicio"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Consulta">Consulta</option>
              <option value="Estudio">Estudio</option>
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ▼
            </span>
          </div>

          {/* Fecha */}
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            aria-label="Filtrar por fecha"
          />

          {/* Médico */}
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

          {/* Laboratorio */}
          <div className="relative">
            <Select
              value={laboratorio}
              onChange={(e) => setLaboratorio(e.target.value)}
              aria-label="Filtrar por laboratorio"
            >
              <option value="Todos">Todos los laboratorios</option>
              {Object.entries(LABORATORIOS).map(([id, nombre]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ▼
            </span>
          </div>

          {/* Estatus */}
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

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ServiciosTable
          servicios={filteredServicios}
          loading={loading}
          error={error}
          onRowClick={handleRowClick}
        />
      </div>

      <NuevoServicioModal
        open={nuevoServicioOpen}
        onClose={() => setNuevoServicioOpen(false)}
        onSelectConsulta={() => setNuevaConsultaOpen(true)}
        onSelectEstudio={() => setNuevoEstudioOpen(true)}
      />
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
