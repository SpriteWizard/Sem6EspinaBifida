'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from './ui/Modal'

// ─── Types ────────────────────────────────────────────────────────────────────

type Consulta = {
  folio: string
  tipo: string
  fecha: string
}

type TipoEstudio = {
  id_tipo_estudio: number
  nombre: string
  descripcion: string
  tiempo_preparacion: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LABORATORIOS_MOCK = [
  { id: 'L01', nombre: 'Lab. Médico Cerrus' },
  { id: 'L02', nombre: 'Centro de Imagen UDEM' },
  { id: 'L03', nombre: 'Hospital San José TEC' },
  { id: 'L04', nombre: 'Laboratorio Clínico Lomas' },
  { id: 'L05', nombre: 'Diagnóstica del Norte' },
]

const TITLE_ID = 'nuevo-estudio-modal-title'

function normalizar(s: string) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NuevoEstudioModal({
  open,
  onClose,
  defaultFolioConsulta,
  defaultAsociadoId,
}: {
  open: boolean
  onClose: () => void
  defaultFolioConsulta?: string
  defaultAsociadoId?: number
}) {
  // Asociado
  const [query, setQuery] = useState('')
  const [seleccionado, setSeleccionado] = useState<any | null>(null)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)

  // Datos del estudio
  const [estudio, setEstudio] = useState('')
  const [laboratorioId, setLaboratorioId] = useState('')
  const [fecha, setFecha] = useState('')
  const [estatus, setEstatus] = useState('Pendiente')

  // Aportación
  const [monto, setMonto] = useState('')
  const [yaAporto, setYaAporto] = useState(false)

  // Consulta vinculada
  const [folioConsulta, setFolioConsulta] = useState('')
  const [folioQuery, setFolioQuery] = useState('')
  const [folioDropdownAbierto, setFolioDropdownAbierto] = useState(false)

  // Notas y resultados
  const [nota, setNota] = useState('')
  const [resultados, setResultados] = useState('')

  // Datos remotos
  const [ASOCIADOS, setASOCIADOS] = useState<any[]>([])
  const [CONSULTAS, setCONSULTAS] = useState<Consulta[]>([])
  const [TIPOESTUDIO, setTIPOESTUDIO] = useState<TipoEstudio[]>([])

  useEffect(() => {
    if (open && defaultFolioConsulta) {
      setFolioConsulta(defaultFolioConsulta)
      setFolioQuery(defaultFolioConsulta)
    }
  }, [open, defaultFolioConsulta])

  useEffect(() => {
    if (!open) return

    fetch('/api/asociados/lista_asociados/estudio').then(async (res) => {
      if (res.ok) {
        const r = await res.json()
        if (r.status === 'ok') {
          setASOCIADOS(r.data)
          if (defaultAsociadoId) {
            const found = r.data.find((a: any) => a.id === defaultAsociadoId)
            if (found) {
              setSeleccionado(found)
              setQuery(`${found.nombre} · #${found.id}`)
            }
          }
        } else { alert('Error al conectarse a la base de datos'); setASOCIADOS([]) }
      } else {
        alert('Error al intentar cargar a los asociados, intentelo de nuevo más adelante')
        setASOCIADOS([])
      }
    })

    fetch('/api/servicios/obtener/consultas/mini').then(async (res) => {
      if (res.ok) {
        const d = await res.json()
        if (d.status === 'ok') setCONSULTAS(d.data)
        else { alert('Error al conectar con la base de datos'); setCONSULTAS([]) }
      } else {
        alert('No se pudo obtener las consultas, intente nuevamente más tarde')
        setCONSULTAS([])
      }
    })

    fetch('/api/servicios/obtener/estudios/tipos').then(async (res) => {
      if (res.ok) {
        const d = await res.json()
        if (d.status === 'ok') setTIPOESTUDIO(d.data)
        else { alert('Error al conectar con la base de datos'); setTIPOESTUDIO([]) }
      } else {
        alert('No se pudo obtener los tipos de estudio, intente nuevamente más tarde')
        setTIPOESTUDIO([])
      }
    })
  }, [open])

  const sugerencias = ASOCIADOS.filter(
    (a: any) =>
      normalizar(a.nombre).includes(normalizar(query)) || String(a.id).includes(query),
  )

  const folioSugerencias = CONSULTAS.filter((c: any) =>
    normalizar(c.folio).includes(normalizar(folioQuery)),
  )

  const resetForm = useCallback(() => {
    setQuery(''); setSeleccionado(null); setDropdownAbierto(false)
    setEstudio(''); setLaboratorioId(''); setFecha(''); setEstatus('Pendiente')
    setMonto(''); setYaAporto(false)
    setFolioConsulta(''); setFolioQuery(''); setFolioDropdownAbierto(false)
    setNota(''); setResultados('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  function handleSelect(asociado: any) {
    setSeleccionado(asociado)
    setQuery(`${asociado.nombre} · #${asociado.id}`)
    setDropdownAbierto(false)
  }

  function handleMonto(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    if (digits === '') { setMonto(''); return }
    const number = parseInt(digits, 10) / 100
    setMonto(number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  async function handleGuardar() {
    if (!seleccionado) { alert('Debes seleccionar un asociado'); return }
    if (!estudio) { alert('Debes seleccionar un tipo de estudio'); return }
    if (!laboratorioId) { alert('Debes seleccionar un laboratorio'); return }
    if (!fecha) { alert('Debes seleccionar una fecha'); return }
    if (folioConsulta === '') { alert('Debes seleccionar una consulta'); return }

    const res = await fetch('/api/servicios/agregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 1,
        data: {
          id_asociado: seleccionado.id,
          id_medico: null,
          id_tipo_estudio: Number(estudio),
          id_consulta: Number(folioConsulta.replace('CON-', '')),
          laboratorio: laboratorioId,
          aportacion: monto,
          ya_aporto: yaAporto ? 1 : 0,
          fecha_cita: fecha,
          estatus,
          resultados,
        },
      }),
    })

    if (res.ok) {
      if ((await res.json()) === 'Success') {
        alert('Estudio agregado correctamente')
        resetForm()
        onClose()
        window.location.reload()
      } else {
        alert('No se pudo agregar el estudio, intente nuevamente')
      }
    } else {
      alert('No se puede conectar con el servicio de agregado de estudios, intente nuevamente más tarde')
    }
  }

  return (
    <Modal
      open={open}
      titleId={TITLE_ID}
      title="Nuevo estudio"
      onClose={handleClose}
      className="flex flex-col max-h-[90vh] max-w-xl"
    >
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

        {/* Asociado */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Asociado
          </h3>
          <div className="relative flex flex-col gap-1">
            <label className="text-xs text-slate-500">Buscar asociado</label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSeleccionado(null); setDropdownAbierto(true) }}
              onFocus={() => { if (!seleccionado) setDropdownAbierto(true) }}
              onBlur={() => setTimeout(() => setDropdownAbierto(false), 150)}
              placeholder="Nombre o número de asociado..."
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
            {dropdownAbierto && query.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-md z-20 overflow-hidden">
                {sugerencias.length > 0 ? (
                  sugerencias.map((a: any) => (
                    <button
                      key={a.id}
                      onMouseDown={() => handleSelect(a)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="text-sm text-slate-800">{a.nombre}</div>
                      <div className="text-xs text-slate-500">Asociado #{a.id}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-sm text-slate-400 italic">Sin resultados.</div>
                )}
              </div>
            )}
          </div>

          {seleccionado && (
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div>
                <span className="block text-xs text-slate-500">Edad</span>
                <span className="text-sm text-slate-800">{seleccionado.edad} años</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Género</span>
                <span className="text-sm text-slate-800">{seleccionado.genero}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Tel. Celular</span>
                <span className="text-sm text-slate-800">
                  {seleccionado.telCel || <span className="italic text-slate-400">No registrado</span>}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Tel. Emergencia</span>
                <span className="text-sm text-slate-800">
                  {seleccionado.telEmergencia || <span className="italic text-slate-400">No registrado</span>}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Datos del estudio */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Datos del estudio
          </h3>
          <div className="flex flex-col gap-3">

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Estudio</label>
              <select
                value={estudio}
                onChange={(e) => setEstudio(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="">Seleccionar estudio...</option>
                {TIPOESTUDIO.map((t) => (
                  <option key={`TE-${t.id_tipo_estudio}`} value={t.id_tipo_estudio}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Laboratorio</label>
              <select
                value={laboratorioId}
                onChange={(e) => setLaboratorioId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="">Seleccionar laboratorio...</option>
                {LABORATORIOS_MOCK.map((lab) => (
                  <option key={lab.id} value={lab.id}>{lab.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Estatus</label>
                <select
                  value={estatus}
                  onChange={(e) => setEstatus(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
            </div>

          </div>
        </section>

        {/* Aportación */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Aportación
          </h3>
          <div className="flex flex-col gap-3">

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Monto (MXN)</label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400">
                <span className="text-sm text-slate-400 mr-1.5">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monto}
                  onChange={handleMonto}
                  placeholder="0.00"
                  className="bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none w-full"
                />
              </div>
            </div>

            {/* Ya aportó - comentado temporalmente
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <div>
                <div className="text-sm text-slate-800">Ya aportó</div>
                <div className="text-xs text-slate-500">Marcar si el pago ya fue recibido</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={yaAporto}
                onClick={() => setYaAporto((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
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
        </section>

        {/* Consulta vinculada */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Consulta vinculada
          </h3>
          <div className="relative flex flex-col gap-1">
            <label className="text-xs text-slate-500">Buscar consulta</label>
            <input
              type="text"
              value={folioQuery}
              onChange={(e) => {
                setFolioQuery(e.target.value)
                setFolioConsulta('')
                setFolioDropdownAbierto(true)
              }}
              onFocus={() => { if (!folioConsulta) setFolioDropdownAbierto(true) }}
              onBlur={() => setTimeout(() => setFolioDropdownAbierto(false), 150)}
              placeholder="Folio de consulta (ej. CON-2026-012)"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
            {folioDropdownAbierto && folioQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-md z-20 overflow-hidden">
                {folioSugerencias.length > 0 ? (
                  folioSugerencias.map((c: any) => (
                    <button
                      key={c.folio}
                      onMouseDown={() => {
                        setFolioConsulta(c.folio)
                        setFolioQuery(c.folio)
                        setFolioDropdownAbierto(false)
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="text-sm text-slate-800">{c.folio}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-sm text-slate-400 italic">Sin resultados.</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Notas y resultados */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Notas y resultados
          </h3>
          <div className="flex flex-col gap-3">

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Nota</label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales..."
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-500">Resultados</label>
                {estatus !== 'Completado' && (
                  <span className="text-xs text-slate-400">Disponible al marcar como Completado</span>
                )}
              </div>
              <textarea
                value={resultados}
                onChange={(e) => setResultados(e.target.value)}
                disabled={estatus !== 'Completado'}
                rows={4}
                placeholder="Pendiente. Se llenará una vez completado el estudio."
                className={`rounded-lg border px-3 py-2.5 text-sm placeholder:text-slate-400 outline-none resize-none transition-colors ${
                  estatus === 'Completado'
                    ? 'border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 focus:ring-1 focus:ring-slate-400'
                    : 'border-dashed border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>

          </div>
        </section>

        <p className="text-xs text-slate-400 text-center">
          El folio se generará automáticamente al guardar.
        </p>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-5 py-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-transparent px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 h-10"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="inline-flex items-center justify-center rounded-full bg-slate-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-10"
        >
          Guardar estudio
        </button>
      </div>
    </Modal>
  )
}
