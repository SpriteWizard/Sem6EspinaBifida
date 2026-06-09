'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { fetchArraySize } from 'oracledb'

const ESTATUS_OPTIONS = ['Pendiente', 'En proceso', 'Completado', 'Cancelado']


export default function EditarEstudioForm({ data }: { data: any }) {

  function formatDateToMMDDYYYY(isoDate: string) {
    const date = new Date(isoDate);

    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${year}-${month}-${day}`;
  }
  const router = useRouter()

  const [medicos, setMedicos] = useState<any[]>([])
  const [tiposEstudio, setTiposEstudio] = useState<any[]>([])
  const [laboratorios, setLaboratorios] = useState<{ id_laboratorio: number; nombre: string }[]>([])
  const [guardando, setGuardando] = useState(false)

  const [idTipoEstudio, setIdTipoEstudio] = useState<number>(data.id_tipo_estudio ?? 0)
  const [idMedico, setIdMedico] = useState<number>(data.id_medico ?? 0)
  const [idLaboratorio, setIdLaboratorio] = useState<string>(data.id_laboratorio ? String(data.id_laboratorio) : '')
  const [estatus, setEstatus] = useState(data.estatus ?? 'Pendiente')
  const [fecha, setFecha] = useState(data.fecha ? formatDateToMMDDYYYY(data.fecha) : '')
  const [aportacion, setAportacion] = useState(String(data.aportacion ?? ''))
  const [yaAporto, setYaAporto] = useState(data.ya_aporto === 1)
  const [nota, setNota] = useState(data.nota ?? '')
  const [resultados, setResultados] = useState(data.resultados ?? '')
  console.log(data)
  useEffect(() => {
    fetch('/api/medicos/lista_medicos')
      .then((r) => (r.ok ? r.json() : []))
      .then(setMedicos)

    fetch('/api/servicios/obtener/estudios/tipos')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setTiposEstudio(d.data ?? []))

    fetch('/api/laboratorios/lista')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLaboratorios(d ?? []))
  }, [])

  useEffect(() => {
    console.log(fecha)

  },[fecha])

  async function handleGuardar() {
    setGuardando(true)
    try {
      const fechaCita = fecha ? `${fecha} 00:00:00` : (data.fecha_cita ?? '')
      const res = await fetch('/api/servicios/editar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 1,
          data: {
            id_estudio: data.id_estudio,
            id_asociado: data.id_asociado,
            id_consulta: data.id_consulta,
            id_medico: idMedico,
            id_tipo_estudio: idTipoEstudio,
            id_laboratorio: Number(idLaboratorio),
            aportacion: Number(String(aportacion).replace(/[^0-9.]/g, '')),
            ya_aporto: yaAporto ? 1 : 0,
            fecha_cita: fechaCita,
            estatus,
            resultados,
          },
        }),
      })
      if (res.ok && (await res.json()) === 'Success') {
        router.push(`/servicios/${data.id_estudio}/detalle-estudio`)
        router.refresh()
      } else {
        alert('Hubo un error al guardar, intente nuevamente')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <Link
          href={`/servicios/${data.id_estudio}/detalle-estudio`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Detalle de estudio
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
              Editar estudio
            </h1>
            <span className="text-sm text-slate-500">
              Folio: EST-{data.id_estudio}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/servicios/${data.id_estudio}/detalle-estudio`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-transparent px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 h-10"
            >
              Cancelar
            </Link>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-10 disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Datos generales */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Datos generales
        </h2>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
            {data.nombre_asociado?.[0]}
            {data.apellidos_asociado?.[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">
              {data.apellidos_asociado ?? '—'}, {data.nombre_asociado ?? '—'}
            </div>
            <div className="text-xs text-slate-500">
              Asociado #{data.id_asociado} · {data.estatus_asociado}
            </div>
          </div>
        </div>
        <hr className="mb-4 border-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Tipo de estudio</label>
            <select
              value={idTipoEstudio}
              onChange={(e) => setIdTipoEstudio(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value={0}>Seleccionar tipo...</option>
              {tiposEstudio.map((t: any) => (
                <option key={t.id_tipo_estudio} value={t.id_tipo_estudio}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Estatus</label>
            <select
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              {ESTATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Médico solicitante</label>
            <select
              value={idMedico}
              onChange={(e) => setIdMedico(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value={0}>Seleccionar médico...</option>
              {medicos.map((m: any) => (
                <option key={m.id_medico} value={m.id_medico}>
                  Dr. {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Fecha de solicitud</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Monto de aportación (MXN)</label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400">
              <span className="text-sm text-slate-400 mr-1.5">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={aportacion}
                onChange={(e) => setAportacion(e.target.value)}
                className="bg-transparent py-2 text-sm text-slate-900 outline-none w-full"
              />
            </div>
          </div>


          {/* Laboratorio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Laboratorio</label>
            <select
              value={idLaboratorio}
              onChange={(e) => setIdLaboratorio(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="">Seleccionar laboratorio...</option>
              {laboratorios.map((lab) => (
                <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Ya aportó - comentado temporalmente
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <div>
            <div className="text-sm text-slate-800">Ya aportó</div>
            <div className="text-xs text-slate-500">El pago ya fue recibido</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={yaAporto}
            onClick={() => setYaAporto((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              yaAporto ? 'bg-slate-700' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                yaAporto ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        */}
      </div>

      {/* Notas */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notas
        </h2>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none resize-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
        />
      </div>

      {/* Consulta vinculada (read-only) */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Consulta vinculada
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">
              {data.tipo_consulta ? data.tipo_consulta.charAt(0).toUpperCase() + data.tipo_consulta.slice(1) : ''} · CON-{data.id_consulta}
            </div>
            <div className="text-xs text-slate-500">
              {data.fecha_consulta} · {data.medico_consulta}
            </div>
          </div>
          <Link
            href={`/servicios/${data.id_consulta}/detalle-consulta`}
            className="text-sm font-medium text-sky-600 hover:text-sky-800 transition"
          >
            Ver consulta ↗
          </Link>
        </div>
      </div>

      {/* Resultados */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Resultados del estudio
        </h2>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-500">Resultados</label>
            {estatus !== 'Completado' && (
              <span className="text-xs text-slate-400">
                Disponible al marcar como Completado
              </span>
            )}
          </div>
          <textarea
            value={resultados}
            onChange={(e) => setResultados(e.target.value)}
            disabled={estatus !== 'Completado'}
            rows={4}
            placeholder="Se llenará una vez completado el estudio."
            className={`rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none resize-none transition-colors ${
              estatus === 'Completado'
                ? 'border-slate-200 bg-slate-50 text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
                : 'border-dashed border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed placeholder:text-slate-400'
            }`}
          />
        </div>
      </div>

    </div>
  )
}
