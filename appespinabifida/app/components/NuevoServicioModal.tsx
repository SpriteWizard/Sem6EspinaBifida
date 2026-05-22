'use client'

import { FlaskConical, Stethoscope } from 'lucide-react'

import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

const NUEVO_MODAL_TITLE_ID = 'nuevo-servicio-modal-title'

type NuevoServicioModalProps = {
  open: boolean
  onClose: () => void
  onSelectConsulta: () => void
  onSelectEstudio: () => void
}

export function NuevoServicioModal({
  open,
  onClose,
  onSelectConsulta,
  onSelectEstudio,
}: NuevoServicioModalProps) {
  return (
    <Modal
      open={open}
      titleId={NUEVO_MODAL_TITLE_ID}
      title="Nuevo servicio"
      onClose={onClose}
    >
      <div className="px-5 pb-5 pt-4">
        <p className="mb-5 text-sm text-slate-600">
          Selecciona el tipo de servicio que deseas registrar.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              onClose()
              onSelectConsulta()
            }}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-sky-200 bg-sky-50 p-6 text-center transition hover:border-sky-400 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-200">
              <Stethoscope className="h-6 w-6 text-sky-700" />
            </span>
            <span className="text-sm font-semibold text-sky-800">Consulta</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onSelectEstudio()
            }}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-violet-200 bg-violet-50 p-6 text-center transition hover:border-violet-400 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-200">
              <FlaskConical className="h-6 w-6 text-violet-700" />
            </span>
            <span className="text-sm font-semibold text-violet-800">Estudio</span>
          </button>
        </div>
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
