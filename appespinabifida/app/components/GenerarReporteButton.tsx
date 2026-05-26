"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, X } from "lucide-react"
import HalfLogoSrc from "../assets/HalfLogo.png"
import { generarReportePDF, MOCK_REPORTE_DATA } from "../lib/pdf/reporte"

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function currentMonthRange(): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, "0")}`,
  }
}

export default function GenerarReporteButton() {
  const [showModal, setShowModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")

  const hasPreview = useMemo(() => previewUrl.length > 0, [previewUrl])

  useEffect(() => {
    const { from, to } = currentMonthRange()
    setDateFrom(from)
    setDateTo(to)
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleGenerar() {
    setIsGenerating(true)
    try {
      const logoBase64 = await loadImageAsBase64(HalfLogoSrc.src)
      // TODO: replace MOCK_REPORTE_DATA with fetch(`/api/metricas/reporte?from=${dateFrom}&to=${dateTo}`)
      const blobUrl = await generarReportePDF(dateFrom, dateTo, MOCK_REPORTE_DATA, logoBase64)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(blobUrl)
      setShowModal(false)
    } finally {
      setIsGenerating(false)
    }
  }

  function handleClose() {
    URL.revokeObjectURL(previewUrl)
    setPreviewUrl("")
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 rounded-md bg-[#003C64] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002847]"
      >
        <FileText className="h-4 w-4" />
        Generar reporte
      </button>

      {/* ── Date-range modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#003C64] px-4 py-3 text-white rounded-t-xl">
              <h3 className="text-sm font-semibold">Generar Reporte de Período</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-white/30 p-1 hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Del</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#003C64] focus:outline-none focus:ring-1 focus:ring-[#003C64]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Al</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#003C64] focus:outline-none focus:ring-1 focus:ring-[#003C64]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerar}
                disabled={isGenerating || !dateFrom || !dateTo}
                className="rounded-md bg-[#003C64] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002847] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? "Generando..." : "Generar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PDF preview modal ────────────────────────────────────────────────── */}
      {hasPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#003C64] px-4 py-3 text-white">
              <h3 className="text-sm font-semibold">Vista previa — Resumen de Período</h3>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-white/30 px-3 py-1 text-xs hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-2">
              <iframe
                src={previewUrl}
                title="Vista previa Reporte PDF"
                className="h-full w-full rounded-md border border-gray-200 bg-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-3">
              <a
                href={previewUrl}
                download={`reporte-${dateFrom}-${dateTo}.pdf`}
                className="rounded-md bg-[#003C64] px-4 py-2 text-sm font-medium text-white hover:bg-[#002847]"
              >
                Descargar PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
