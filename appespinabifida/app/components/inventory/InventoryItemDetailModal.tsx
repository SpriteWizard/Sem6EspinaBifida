'use client'

import { useEffect, useState } from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { listMovements } from '../../lib/api/movements'
import { updateInventoryItemSettings } from '../../lib/api/inventory'
import type { InventoryItem } from '../../lib/types/inventory'
import type { InventoryMovement } from '../../lib/types/movements'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { MovementHistoryList } from './MovementHistoryList'

type TabName = 'info' | 'movements'

type Props = {
  open: boolean
  item: InventoryItem | null
  onClose: () => void
  onItemUpdated: (item: InventoryItem) => void
}

const TITLE_ID = 'inventory-item-detail-modal-title'
const MOVEMENTS_PAGE_SIZE = 3

function statusLabel(status: InventoryItem['status']) {
  if (status === 'in_stock') return 'En stock'
  if (status === 'low_stock') return 'Bajo'
  return 'Agotado'
}

function statusVariant(status: InventoryItem['status']) {
  if (status === 'in_stock') return 'success'
  if (status === 'low_stock') return 'failed'
  return 'warning'
}

export function InventoryItemDetailModal({
  open,
  item,
  onClose,
  onItemUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('info')
  const [cuotaValue, setCuotaValue] = useState('')
  const [cuotaError, setCuotaError] = useState<string | null>(null)
  const [stockMinimoValue, setStockMinimoValue] = useState('0')
  const [stockMinimoError, setStockMinimoError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [movementPages, setMovementPages] = useState<InventoryMovement[][]>([])
  const [movementPageIndex, setMovementPageIndex] = useState(0)
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [movementsLoadingNext, setMovementsLoadingNext] = useState(false)
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [movementsNextCursor, setMovementsNextCursor] = useState<string | null>(null)

  const visibleMovements = movementPages[movementPageIndex] ?? []
  const showMovementsError = movementPages.length === 0 ? movementsError : null
  const canGoPrevious = movementPageIndex > 0
  const canGoNext = movementPageIndex < movementPages.length - 1 || movementsNextCursor !== null

  async function fetchMovementsPage(targetItem: InventoryItem, cursor: string | null) {
    return listMovements({
      movementType: 'all',
      itemType: 'all',
      itemId: targetItem.id,
      itemName: targetItem.name,
      date: '',
      search: '',
      cursor,
      limit: MOVEMENTS_PAGE_SIZE,
    })
  }

  useEffect(() => {
    if (!open || !item) return

    setActiveTab('info')
    setCuotaError(null)
    setStockMinimoError(null)
    setSettingsSaved(false)
    setMovementPages([])
    setMovementPageIndex(0)
    setMovementsLoading(false)
    setMovementsLoadingNext(false)
    setMovementsError(null)
    setMovementsNextCursor(null)
    setCuotaValue(
      item.cuotaRecuperacion === null ? '' : String(item.cuotaRecuperacion),
    )
    setStockMinimoValue(String(item.stockMinimo ?? 0))
    setNombre(String(item.name));
    setDescripcion(String(item.description))
  }, [open, item])

  useEffect(() => {
    if (!open || !item || activeTab !== 'movements' || movementPages.length > 0) return

    let alive = true
    setMovementsLoading(true)
    setMovementsError(null)

    void fetchMovementsPage(item, null)
      .then((res) => {
        if (!alive) return
        setMovementPages([res.items])
        setMovementPageIndex(0)
        setMovementsNextCursor(res.nextCursor)
      })
      .catch((error) => {
        if (!alive) return
        setMovementsError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los movimientos de este artículo.',
        )
      })
      .finally(() => {
        if (!alive) return
        setMovementsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, item, activeTab, movementPages.length])

  async function handlePreviousMovementsPage() {
    if (movementPageIndex <= 0 || movementsLoading || movementsLoadingNext) return
    setMovementPageIndex((prev) => Math.max(0, prev - 1))
  }

  async function handleNextMovementsPage() {
    if (!item || movementsLoading || movementsLoadingNext) return

    if (movementPageIndex < movementPages.length - 1) {
      setMovementPageIndex((prev) => prev + 1)
      return
    }

    if (!movementsNextCursor) return

    setMovementsLoadingNext(true)
    setMovementsError(null)
    try {
      const res = await fetchMovementsPage(item, movementsNextCursor)
      setMovementPages((prev) => [...prev, res.items])
      setMovementPageIndex((prev) => prev + 1)
      setMovementsNextCursor(res.nextCursor)
    } catch (error) {
      setMovementsError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar más movimientos de este artículo.',
      )
    } finally {
      setMovementsLoadingNext(false)
    }
  }

  if (!item) return null
  const currentItem = item

  async function handleSaveQuota() {
    setSettingsSaved(false)
    setCuotaError(null)
    setStockMinimoError(null)

    const trimmed = cuotaValue.trim()
    const parsedQuota = trimmed === '' ? null : Number(trimmed)
    if (parsedQuota !== null && (Number.isNaN(parsedQuota) || parsedQuota < 0)) {
      setCuotaError('Ingresa una cuota válida mayor o igual a 0.')
      return
    }

    const parsedStock = Number(stockMinimoValue)
    if (stockMinimoValue.trim() === '' || Number.isNaN(parsedStock) || parsedStock < 0) {
      setStockMinimoError('Ingresa un stock mínimo válido mayor o igual a 0.')
      return
    }

    setSavingSettings(true)
    try {
      const updated = await updateInventoryItemSettings(currentItem.id, parsedQuota, Math.floor(parsedStock), nombre, descripcion)
      onItemUpdated(updated)
      setSettingsSaved(true)
    } catch {
      setCuotaError('No se pudo actualizar la cuota de recuperación.')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <Modal
      open={open}
      titleId={TITLE_ID}
      title={`Artículo INV-${item.id}`}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="px-5 pb-5 pt-4">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <Button
            type="button"
            variant={activeTab === 'info' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('info')}
          >
            Información del artículo
          </Button>
          <Button
            type="button"
            variant={activeTab === 'movements' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('movements')}
          >
            Movimientos asociados
          </Button>
        </div>

        {activeTab === 'info' ? (

          <div className="space-y-4 max-h-[60vh] overflow-y-auto" >

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre del artículo
              </label>
              <Input
                type="string"
                value={nombre}
                onChange={(e) => {
                  setSettingsSaved(false)
                  setNombre(e.target.value)
                }}
                placeholder="Ej. 150.00"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                <p className="text-xs text-slate-500">ID</p>
                <p className="text-sm font-semibold text-slate-800">{currentItem.id}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                <p className="text-xs text-slate-500">Categoría</p>
                <p className="text-sm font-semibold text-slate-800">{currentItem.categoryName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                <p className="text-xs text-slate-500">Inventario actual</p>
                <p className="text-sm font-semibold text-slate-800">{currentItem.quantity} unidades</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                <p className="text-xs text-slate-500">Disponibilidad</p>
                <Badge variant={statusVariant(currentItem.status)} className="mt-1">
                  {statusLabel(currentItem.status)}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descripcion
                </label>
                <Input
                  type="string"
                  value={descripcion}
                  onChange={(e) => {
                    setSettingsSaved(false)
                    setDescripcion(e.target.value)
                  }}
                  placeholder="Ej. 150.00"
                />
              </div>

            </div>

            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cuota de recuperación
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={cuotaValue}
                    onChange={(e) => {
                      setSettingsSaved(false)
                      setCuotaValue(e.target.value)
                    }}
                    placeholder="Ej. 150.00"
                    aria-invalid={Boolean(cuotaError)}
                  />
                  {cuotaError ? (
                    <p className="mt-1 text-sm text-rose-700">{cuotaError}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Puedes dejarlo vacío para mantenerla sin definir.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Stock mínimo
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={stockMinimoValue}
                    onChange={(e) => {
                      setSettingsSaved(false)
                      setStockMinimoValue(e.target.value)
                    }}
                    placeholder="0"
                    aria-invalid={Boolean(stockMinimoError)}
                  />
                  {stockMinimoError ? (
                    <p className="mt-1 text-sm text-rose-700">{stockMinimoError}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Cuando el inventario llegue a este valor o menos, el artículo se
                      mostrará como Bajo.
                    </p>
                  )}
                </div>
              </div>
              {settingsSaved ? (
                <p className="mt-2 text-sm text-emerald-700">Cambios guardados.</p>
              ) : null}
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveQuota}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white ring-1 ring-slate-200/70 max-h-[60vh] overflow-y-auto">
            <MovementHistoryList
              items={visibleMovements}
              loading={movementsLoading}
              error={showMovementsError}
            />
            {movementPages.length > 0 ? (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0"
                    aria-label="Página anterior"
                    onClick={() => void handlePreviousMovementsPage()}
                    disabled={!canGoPrevious || movementsLoading || movementsLoadingNext}
                    leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden />}
                  />
                  <div className="min-w-24 text-center text-sm font-medium text-slate-600">
                    Página {movementPageIndex + 1}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full p-0"
                    aria-label="Página siguiente"
                    onClick={() => void handleNextMovementsPage()}
                    disabled={!canGoNext || movementsLoading || movementsLoadingNext}
                    leftIcon={<ChevronRight className="h-4 w-4" aria-hidden />}
                  />
                </div>
                {movementsError && movementPages.length > 0 ? (
                  <p className="mt-3 text-center text-sm text-rose-700" role="alert">
                    {movementsError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  )
}
