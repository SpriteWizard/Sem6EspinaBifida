'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '../ui/Modal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validarHora(valor: string): boolean {
  if (!valor) return true
  const match = valor.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return false
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  return h >= 1 && h <= 12 && m >= 0 && m <= 59
}

function to24Hour(hora: string, periodo: string) {
  let [h, m] = hora.split(':').map(Number)
  if (periodo === 'PM' && h !== 12) h += 12
  if (periodo === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function normalizar(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const TITLE_ID = 'nueva-consulta-modal-title'

// ─── Component ────────────────────────────────────────────────────────────────

export function NuevaConsultaModal({
  open,
  onClose,
  listaNuevaConsulta,
  setListaNuevaConsulta,
  setModalAbiertoNuevaConsulta,
  id_recibo,
  defaultAsociadoId,
  defaultAsociadoNombre,
}: {
  open: boolean
  onClose: () => void
  listaNuevaConsulta: any[]
  setListaNuevaConsulta: React.Dispatch<React.SetStateAction<any[]>>
  setModalAbiertoNuevaConsulta: React.Dispatch<React.SetStateAction<boolean>>
  id_recibo: number
  defaultAsociadoId?: number
  defaultAsociadoNombre?: string
}) {
  const router = useRouter()
  const prefillsAppliedRef = useRef(false)

  const [asociados, setAsociados] = useState<any[]>([])
  const [medicos, setMedicos] = useState<any[]>([])

  useEffect(() => {
    if (!open) return
    const fetchData = async () => {
      const res = await fetch('/api/asociados/lista_asociados/mini')
      if (res.ok) setAsociados(await res.json())
      const res2 = await fetch('/api/medicos/lista_medicos')
      if (res2.ok) setMedicos(await res2.json())
    }
    fetchData()
  }, [open])

  const listaAsociados = asociados.map((a: any) => ({
    id: String(a.id_asociado),
    nombre: a.nombre + ' ' + a.apellidos,
  }))

  useEffect(() => {
    if (!open) {
      prefillsAppliedRef.current = false
      return
    }

    if (prefillsAppliedRef.current || defaultAsociadoId == null) return

    const fallback = {
      id: String(defaultAsociadoId),
      nombre: defaultAsociadoNombre || `Asociado #${defaultAsociadoId}`,
    }

    const matched = listaAsociados.find((a) => Number(a.id) === defaultAsociadoId)
    const seleccionadoInicial = matched || fallback

    setSeleccionado(seleccionadoInicial)
    setQuery(`${seleccionadoInicial.nombre} · #${seleccionadoInicial.id}`)
    setDropdownAbierto(false)
    prefillsAppliedRef.current = true
  }, [open, defaultAsociadoId, defaultAsociadoNombre, listaAsociados])

  const [query, setQuery] = useState('')
  const [seleccionado, setSeleccionado] = useState<{ id: string; nombre: string } | null>(null)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [monto, setMonto] = useState('')
  const [hora, setHora] = useState('')
  const [periodo, setPeriodo] = useState('AM')
  const [horaTocada, setHoraTocada] = useState(false)
  const [tipoConsulta, setTipoConsulta] = useState('')
  const [fecha, setFecha] = useState('')
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(0)

  const horaInvalida = horaTocada && !validarHora(hora)

  const resetForm = useCallback(() => {
    setQuery('')
    setSeleccionado(null)
    setDropdownAbierto(false)
    setMonto('')
    setHora('')
    setPeriodo('AM')
    setHoraTocada(false)
    setTipoConsulta('')
    setFecha('')
    setMedicoSeleccionado(0)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  async function guardarConsulta() {
    if (!seleccionado) { alert('Debes seleccionar un asociado'); return }
    if (!tipoConsulta) { alert('Debes seleccionar un tipo de consulta'); return }
    if (!medicoSeleccionado) { alert('Debes seleccionar un médico responsable'); return }
    if (!fecha) { alert('Debes seleccionar una fecha'); return }
    if (!hora || !validarHora(hora)) { alert('Debes capturar una hora válida'); return }

    const nuevo = {
      id_consulta_local: 'CON-' + String(listaNuevaConsulta.length),
      id_asociado: Number(seleccionado?.id),
      id_medico: medicoSeleccionado,
      id_recibo: id_recibo,
      tipo_consulta: tipoConsulta,
      motivo: null,
      diagnostico: null,
      tratamiento: null,
      aportacion: monto,
      ya_aporto: 0,
      estatus: false,
      fecha_cita: String(fecha + ' ' + to24Hour(hora, periodo)),
    }
    setListaNuevaConsulta((prev) => [...prev, nuevo])
    setModalAbiertoNuevaConsulta(false)
  }

  function handleMonto(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    if (digits === '') { setMonto(''); return }
    const number = parseInt(digits, 10) / 100
    setMonto(number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  function handleHora(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw.length <= 2) {
      setHora(raw.length === 2 ? raw + ':' : raw)
    } else {
      setHora(raw.slice(0, 2) + ':' + raw.slice(2, 4))
    }
  }

  const sugerencias = listaAsociados.filter(
    (a) => normalizar(a.nombre).includes(normalizar(query)) || a.id.includes(query),
  )

  function handleSelect(asociado: { id: string; nombre: string }) {
    setSeleccionado(asociado)
    setQuery(`${asociado.nombre} · #${asociado.id}`)
    setDropdownAbierto(false)
  }

  return (
    <Modal
      open={open}
      titleId={TITLE_ID}
      title="Nueva consulta"
      onClose={handleClose}
      className="flex flex-col max-h-[90vh] max-w-xl"
    >
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

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
                  sugerencias.map((a) => (
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
        </section>

        {/* Datos de la consulta */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Datos de la consulta
          </h3>
          <div className="flex flex-col gap-3">

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Tipo de consulta</label>
              <select
                onChange={(e) => setTipoConsulta(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="primera">Consulta general</option>
                <option value="seguimiento">Consulta de seguimiento</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Médico responsable</label>
              <select
                onChange={(e) => setMedicoSeleccionado(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="">Selecciona médico responsable</option>
                {medicos.map((m: any) => (
                  <option key={`medico-${m.id_medico}`} value={m.id_medico}>
                    Dr(a) {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Fecha</label>
                <input
                  type="date"
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Hora</label>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <input
                      type="text"
                      value={hora}
                      onChange={handleHora}
                      onBlur={() => setHoraTocada(true)}
                      placeholder="12:00"
                      maxLength={5}
                      className={`rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 w-full ${
                        horaInvalida
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                      }`}
                    />
                    {horaInvalida && (
                      <span className="text-xs text-red-500">Hora inválida (ej: 8:30)</span>
                    )}
                  </div>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 cursor-pointer"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Monto de aportación (MXN)</label>
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
          onClick={guardarConsulta}
          className="inline-flex items-center justify-center rounded-full bg-slate-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-10"
        >
          Guardar consulta
        </button>
      </div>
    </Modal>
  )
}
