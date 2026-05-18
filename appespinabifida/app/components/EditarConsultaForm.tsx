'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const ESTATUS_OPTIONS = ['Pendiente', 'En proceso', 'Completado', 'Cancelado']

const LABORATORIOS_MOCK = [
  { id: 'L01', nombre: 'Lab. Médico Cerrus' },
  { id: 'L02', nombre: 'Centro de Imagen UDEM' },
  { id: 'L03', nombre: 'Hospital San José TEC' },
  { id: 'L04', nombre: 'Laboratorio Clínico Lomas' },
  { id: 'L05', nombre: 'Diagnóstica del Norte' },
]

export default function EditarConsultaForm({ id, data }: { id: any,  data: any }) {
  const router = useRouter()

  const [medicos, setMedicos] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)

  const [tipoConsulta, setTipoConsulta] = useState(data.tipo_consulta ?? '')
  const [estatus, setEstatus] = useState(data.estatus ?? 'Pendiente')
  const [idMedico, setIdMedico] = useState<number>(data.id_medico ?? 0)
  const [fecha, setFecha] = useState(data.fecha ?? '')
  const [hora, setHora] = useState(data.hora ?? '')
  const [aportacion, setAportacion] = useState(String(data.aportacion ?? ''))
  const [diagnostico, setDiagnostico] = useState(data.diagnostico ?? '')
  const [tratamiento, setTratamiento] = useState(data.tratamiento ?? '')
  const [yaAporto, setYaAporto] = useState(data.ya_aporto === 1)

  useEffect(() => {
    fetch('/api/medicos/lista_medicos')
      .then((r) => (r.ok ? r.json() : []))
      .then(setMedicos)
  }, [])

  async function handleGuardar() {
    setGuardando(true)
    try {
      const fechaCita =
        fecha && hora ? `${fecha} ${hora}:00` : (data.fecha_cita ?? '')
      const res = await fetch('/api/servicios/editar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 0,
          data: {
            id_consulta: data.id_consulta,
            id_asociado: data.id_asociado,
            id_medico: idMedico,
            id_recibo: data.id_recibo ?? null,
            tipo_consulta: tipoConsulta,
            motivo: data.motivo ?? null,
            diagnostico,
            tratamiento,
            aportacion: Number(String(aportacion).replace(/[^0-9.]/g, '')),
            ya_aporto: yaAporto ? 1 : 0,
            estatus,
            fecha_cita: fechaCita,
          },
        }),
      })
      if (res.ok && (await res.json()) === 'Success') {
        router.push(`/servicios/${data.id_consulta}/detalle-consulta`)
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
          href={`/servicios/${data.id_consulta}/detalle-consulta`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Detalle de consulta
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
              Editar consulta
            </h1>
            <span className="text-sm text-slate-500">
              Folio: CON-{data.id_consulta}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/servicios/${data.id_consulta}/detalle-consulta`}
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-medium text-sky-700">
            {data.nombre_asociado?.[0]}
            {data.apellidos_asociado?.[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">
              {data.apellidos_asociado ?? '—'}, {data.nombre_asociado ?? '—'}
            </div>
            <div className="text-xs text-slate-500">
              Asociado #{data.id_asociado} · {data.status_asociado}
            </div>
          </div>
        </div>
        <hr className="mb-4 border-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Tipo de consulta</label>
            <select
              value={tipoConsulta}
              onChange={(e) => setTipoConsulta(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value="primera">Consulta general</option>
              <option value="seguimiento">Consulta de seguimiento</option>
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
            <label className="text-xs text-slate-500">Médico responsable</label>
            <select
              value={idMedico}
              onChange={(e) => setIdMedico(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
            >
              <option value={0}>Seleccionar médico...</option>
              {medicos.map((m: any) => (
                <option key={m.id_medico} value={m.id_medico}>
                  Dr(a). {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
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

      {/* Diagnóstico y tratamiento */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Diagnóstico y tratamiento
        </h2>
        <div className="mb-4 flex flex-col gap-1">
          <label className="text-xs text-slate-500">Diagnóstico</label>
          <textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Tratamiento indicado</label>
          <textarea
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none"
          />
        </div>
      </div>

    </div>
  )
}
