'use client'

import { useState } from 'react'
import { NuevoEstudioModal } from './NuevoEstudioModal'

export default function SolicitarEstudioButton({
  folioConsulta,
  defaultAsociadoId,
}: {
  folioConsulta: string
  defaultAsociadoId: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-10"
      >
        Solicitar estudio
      </button>
      <NuevoEstudioModal
        open={open}
        onClose={() => setOpen(false)}
        defaultFolioConsulta={folioConsulta}
        defaultAsociadoId={defaultAsociadoId}
      />
    </>
  )
}
