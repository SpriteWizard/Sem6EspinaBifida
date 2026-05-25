'use client'

import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Printer } from 'lucide-react'

import HalfLogoSrc from '../../assets/HalfLogo.png'
import type { InventoryMovement } from '../../lib/types/movements'
import { Button } from '../ui/Button'

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

function userLabel(m: InventoryMovement) {
  const firstName = m.userFirstName?.trim()
  const lastName = m.userLastName?.trim()
  const name = m.userName?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim()
  const email = m.userEmail?.trim()
  const role = m.userRole?.trim()

  if (name && email) return `${name} · ${email}`
  if (name) return name
  if (email) return email
  if (role) return role
  return 'Usuario no disponible'
}

function movementLabel(m: InventoryMovement) {
  return m.movementType === 'in' ? 'Entrada' : 'Salida'
}

type ImprimirComodatoButtonProps = {
  movement: InventoryMovement
}

export default function ImprimirComodatoButton({ movement }: ImprimirComodatoButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [downloadName, setDownloadName] = useState('comodato.pdf')
  const [errorMessage, setErrorMessage] = useState('')

  const hasPreview = useMemo(() => previewUrl.length > 0, [previewUrl])
  const isEligible = movement.movementType === 'out' && Boolean(movement.esComodato)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function handleGeneratePdf() {
    if (!isEligible) return
    setIsLoading(true)
    setErrorMessage('')

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }

    try {
      const logoData = await loadImageAsBase64(HalfLogoSrc.src)
      const doc = new jsPDF({ format: 'a4', unit: 'mm' })

      doc.setFillColor(0, 60, 100)
      doc.rect(0, 0, 210, 24, 'F')

      if (logoData) {
        doc.addImage(logoData, 'PNG', 14, 5, 14, 14)
      } else {
        doc.setFillColor(240, 186, 64)
        doc.rect(14, 5, 14, 14, 'F')
      }

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Comodato de inventario', 34, 15)

      doc.setTextColor(42, 42, 42)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Movimiento: ${movement.id}`, 14, 32)
      doc.text(`Fecha: ${movement.date || 'No disponible'}`, 140, 32)

      doc.setDrawColor(220, 220, 220)
      doc.line(14, 36, 196, 36)

      let y = 46

      const writeSectionTitle = (title: string) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(0, 60, 100)
        doc.text(title, 14, y)
        y += 4
        doc.setDrawColor(220, 220, 220)
        doc.line(14, y, 196, y)
        y += 6
      }

      const writeField = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0, 60, 100)
        doc.text(label, 14, y)

        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(33, 37, 41)
        const safeValue = value?.trim() || '—'
        const lines = doc.splitTextToSize(safeValue, 182)
        doc.text(lines, 14, y)
        y += lines.length * 5 + 3
      }

      writeSectionTitle('Resumen del movimiento')
      writeField('Tipo de movimiento', movementLabel(movement))
      writeField('Articulo', movement.itemName || 'No disponible')
      writeField('Tipo de articulo', movement.itemType || 'No disponible')
      writeField('Cantidad', String(movement.quantity ?? 0))
      writeField('Registrado por', userLabel(movement))
      if (movement.itemId) writeField('ID de articulo', String(movement.itemId))
      if (movement.notes?.trim()) writeField('Notas del movimiento', movement.notes)

      writeSectionTitle('Datos del comodato')
      writeField('A quien se presta', movement.comodatoAQuien || 'No disponible')
      writeField('Tiempo estimado', movement.comodatoTiempo || 'No disponible')
      writeField('Condiciones', movement.comodatoCondiciones || 'No disponible')

      const signatureY = Math.max(y + 6, 220)
      doc.setDrawColor(180, 180, 180)
      doc.line(20, signatureY, 90, signatureY)
      doc.line(120, signatureY, 190, signatureY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(90, 90, 90)
      doc.text('Entrega', 20, signatureY + 5)
      doc.text('Recibe', 120, signatureY + 5)

      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Asociacion de Espina Bifida de Nuevo Leon ABP', 14, 287)

      const blob = doc.output('blob')
      const blobUrl = URL.createObjectURL(blob)
      setPreviewUrl(blobUrl)
      setDownloadName(`comodato-movimiento-${movement.id}.pdf`)
    } catch {
      setErrorMessage('No se pudo generar el PDF del comodato.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEligible) return null

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-slate-400 hover:text-slate-600"
        aria-label="Imprimir comodato"
        title={errorMessage || 'Imprimir comodato'}
        onClick={handleGeneratePdf}
        disabled={isLoading}
      >
        <Printer className="h-4 w-4" aria-hidden />
      </Button>

      {hasPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#003C64] px-4 py-3 text-white">
              <h3 className="text-sm font-semibold">Vista previa del comodato</h3>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl('')
                }}
                className="rounded-md border border-white/30 px-3 py-1 text-xs hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 bg-gray-100 p-2">
              <iframe
                src={previewUrl}
                title="Vista previa PDF comodato"
                className="h-full w-full rounded-md border border-gray-200 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-3">
              <a
                href={previewUrl}
                download={downloadName}
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
