'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  findSimilarInventoryItemsByName,
  movementItemTypeFromCategoryId,
  searchInventoryItemsByName,
} from '../../lib/api/inventory'
import { createMovement } from '../../lib/api/movements'
import type { InventoryItem } from '../../lib/types/inventory'
import type {
  CreateMovementInput,
  InventoryMovement,
  MovementItemType,
  MovementType,
} from '../../lib/types/movements'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

const TITLE_ID = 'new-movement-modal-title'

type FieldErrors = {
  movementType?: string
  itemType?: string
  itemName?: string
  newItemDescription?: string
  newItemUnidad?: string
  newItemProveedor?: string
  newItemStockMinimo?: string
  newItemCuotaRecuperacion?: string
  date?: string
  quantity?: string
}

type Props = {
  open: boolean
  onClose: () => void
  itemTypes: MovementItemType[]
  onCreated: (m: InventoryMovement) => void
  initial?: InventoryMovement | null
}

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function NewMovementModal({
  open,
  onClose,
  itemTypes,
  onCreated,
  initial,
}: Props) {
  const [movementType, setMovementType] = useState<MovementType>('in')
  const [itemType, setItemType] = useState<MovementItemType | ''>('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [itemName, setItemName] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemUnidad, setNewItemUnidad] = useState('')
  const [newItemProveedor, setNewItemProveedor] = useState('')
  const [newItemStockMinimo, setNewItemStockMinimo] = useState('0')
  const [newItemCuotaRecuperacion, setNewItemCuotaRecuperacion] = useState('')
  const [date, setDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [allowSimilarCreate, setAllowSimilarCreate] = useState(false)

  const [suggestions, setSuggestions] = useState<InventoryItem[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [similarMatches, setSimilarMatches] = useState<InventoryItem[]>([])
  const [stockHelpOpen, setStockHelpOpen] = useState(false)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const itemTypeOptions = useMemo(() => itemTypes, [itemTypes])

  useEffect(() => {
    if (!open) return
    setErrors({})
    setSubmitError(null)
    setSubmitting(false)
    setAllowSimilarCreate(false)
    setSimilarMatches([])
    setSuggestions([])
    setStockHelpOpen(false)

    if (initial) {
      setMovementType(initial.movementType)
      setItemType(initial.itemType)
      setSelectedItemId(initial.itemId)
      setItemName(initial.itemName)
      setNewItemDescription('')
      setNewItemUnidad('')
      setNewItemProveedor('')
      setNewItemStockMinimo('0')
      setNewItemCuotaRecuperacion('')
      setDate(initial.date)
      setQuantity(String(initial.quantity))
      setNotes(initial.notes ?? '')
      return
    }

    setMovementType('in')
    setItemType('')
    setSelectedItemId(null)
    setItemName('')
    setNewItemDescription('')
    setNewItemUnidad('pieza')
    setNewItemProveedor('')
    setNewItemStockMinimo('0')
    setNewItemCuotaRecuperacion('')
    setDate(todayISO())
    setQuantity('')
    setNotes('')
  }, [open, initial])

  useEffect(() => {
    if (!open) return

    const query = itemName.trim()
    if (!query) {
      setSuggestions([])
      setSimilarMatches([])
      return
    }

    let alive = true
    setSuggestionsLoading(true)

    Promise.all([
      searchInventoryItemsByName(query, 6),
      movementType === 'in' && selectedItemId === null && query.length >= 3
        ? findSimilarInventoryItemsByName(query, 4)
        : Promise.resolve([]),
    ])
      .then(([suggestedItems, similarItems]) => {
        if (!alive) return

        setSuggestions(suggestedItems)

        const normalizedQuery = normalizeName(query)
        const filteredSimilar = similarItems.filter(
          (item) => normalizeName(item.name) !== normalizedQuery,
        )
        setSimilarMatches(filteredSimilar)
      })
      .catch(() => {
        if (!alive) return
        setSuggestions([])
        setSimilarMatches([])
      })
      .finally(() => {
        if (!alive) return
        setSuggestionsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [open, itemName, movementType, selectedItemId])

  useEffect(() => {
    if (!open) return
    setAllowSimilarCreate(false)
  }, [movementType, open])

  function validate(): boolean {
    const next: FieldErrors = {}

    if (!movementType) next.movementType = 'Selecciona el tipo de movimiento.'

    if (!date) next.date = 'Selecciona una fecha.'

    const q = Number(quantity)
    if (quantity === '' || Number.isNaN(q) || q <= 0) {
      next.quantity = 'Indica una cantidad válida (mayor a 0).'
    }

    const trimmedName = itemName.trim()
    const normalizedInputName = normalizeName(trimmedName)
    const hasExactSuggestion = suggestions.some(
      (item) => normalizeName(item.name) === normalizedInputName,
    )

    if (movementType === 'out') {
      if (!selectedItemId) {
        next.itemName = 'Para salida debes seleccionar un artículo existente.'
      }
    } else {
      if (!trimmedName) {
        next.itemName = 'Indica el nombre del artículo.'
      }
      if (!selectedItemId && !hasExactSuggestion && !itemType) {
        next.itemType = 'Selecciona el tipo de artículo para crear uno nuevo.'
      }
      if (!selectedItemId && !hasExactSuggestion) {
        if (!newItemDescription.trim()) {
          next.newItemDescription = 'La descripción del artículo es obligatoria.'
        }
        if (!newItemUnidad.trim()) {
          next.newItemUnidad = 'La unidad del artículo es obligatoria.'
        }
        if (!newItemProveedor.trim()) {
          next.newItemProveedor = 'El proveedor del artículo es obligatorio.'
        }

        const stockMinimo = Number(newItemStockMinimo)
        if (
          newItemStockMinimo.trim() === '' ||
          Number.isNaN(stockMinimo) ||
          stockMinimo < 0
        ) {
          next.newItemStockMinimo =
            'Stock minimo invalido (debe ser 0 o mayor).'
        }

        if (newItemCuotaRecuperacion.trim() !== '') {
          const cuota = Number(newItemCuotaRecuperacion)
          if (Number.isNaN(cuota) || cuota < 0) {
            next.newItemCuotaRecuperacion =
              'Cuota invalida (debe ser 0 o mayor).'
          }
        }
      }

      if (
        !selectedItemId &&
        !hasExactSuggestion &&
        similarMatches.length > 0 &&
        !allowSimilarCreate
      ) {
        next.itemName =
          'Hay artículos con nombre muy parecido. Selecciona una sugerencia o confirma crear uno nuevo.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSelectSuggestion(item: InventoryItem) {
    setSelectedItemId(item.id)
    setItemName(item.name)
    setItemType(movementItemTypeFromCategoryId(item.categoryId))
    setNewItemDescription(item.description ?? '')
    setNewItemUnidad(item.unidad ?? '')
    setNewItemProveedor(item.proveedor ?? '')
    setNewItemStockMinimo(String(item.stockMinimo ?? 0))
    setNewItemCuotaRecuperacion(
      item.cuotaRecuperacion === null ? '' : String(item.cuotaRecuperacion),
    )
    setAllowSimilarCreate(false)
    setSimilarMatches([])
    setErrors((prev) => ({
      ...prev,
      itemName: undefined,
      itemType: undefined,
      newItemDescription: undefined,
      newItemUnidad: undefined,
      newItemProveedor: undefined,
      newItemStockMinimo: undefined,
      newItemCuotaRecuperacion: undefined,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    const resolvedType: MovementItemType =
      (itemType as MovementItemType) || 'Consumible'
    const parsedStockMinimo = Math.floor(Number(newItemStockMinimo))
    const parsedCuotaRecuperacion =
      newItemCuotaRecuperacion.trim() === ''
        ? null
        : Number(newItemCuotaRecuperacion)

    setSubmitting(true)
    try {
      const input: CreateMovementInput = {
        movementType,
        itemType: resolvedType,
        itemId: selectedItemId ?? undefined,
        itemName: itemName.trim(),
        newItemDescription: newItemDescription.trim(),
        newItemUnidad: newItemUnidad.trim(),
        newItemProveedor: newItemProveedor.trim(),
        newItemStockMinimo: Number.isNaN(parsedStockMinimo)
          ? undefined
          : parsedStockMinimo,
        newItemCuotaRecuperacion: Number.isNaN(parsedCuotaRecuperacion as number)
          ? null
          : parsedCuotaRecuperacion,
        date,
        quantity: Math.floor(Number(quantity)),
        notes: notes.trim(),
        allowSimilarCreate,
      }
      const m = await createMovement(input)
      onCreated(m)
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message)
      } else {
        setSubmitError('No se pudo registrar el movimiento. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      titleId={TITLE_ID}
      title={initial ? 'Editar movimiento' : 'Registrar movimiento'}
      onClose={onClose}
      className="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="flex max-h-[calc(100vh-8rem)] flex-col px-5 pb-5 pt-4">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1.05fr_0.95fr]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50">
            <div className="border-b border-slate-200/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Artículo
              </p>
              <p className="text-sm text-slate-600">
                Busca un artículo existente o llena los datos para crear uno nuevo.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Artículo
                </label>
                <Input
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value)
                    setSubmitError(null)
                    setAllowSimilarCreate(false)
                    setErrors((prev) => ({ ...prev, itemName: undefined }))
                    if (selectedItemId !== null) {
                      setSelectedItemId(null)
                    }
                  }}
                  placeholder="Escribe para buscar y seleccionar"
                  aria-invalid={Boolean(errors.itemName)}
                />

                {suggestionsLoading ? (
                  <p className="mt-2 text-xs text-slate-500">Buscando artículos…</p>
                ) : null}

                {itemName.trim() ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {suggestions.length > 0 ? (
                      <div className="max-h-36 overflow-y-auto">
                        {suggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm transition last:border-b-0 hover:bg-slate-50"
                            onClick={() => handleSelectSuggestion(item)}
                          >
                            <span className="font-medium text-slate-800">{item.name}</span>
                            <span className="text-xs text-slate-500">{item.categoryName}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-500">
                        {movementType === 'out'
                          ? 'No hay coincidencias. Para salida debes elegir un artículo existente.'
                          : 'Sin coincidencias exactas. Puedes crear uno nuevo si lo confirmas.'}
                      </div>
                    )}
                  </div>
                ) : null}

                {selectedItemId !== null ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Artículo seleccionado del inventario.
                  </p>
                ) : null}

                {errors.itemName ? (
                  <p className="mt-1 text-sm text-rose-700">{errors.itemName}</p>
                ) : null}
              </div>

              {movementType === 'in' && selectedItemId === null && similarMatches.length > 0 ? (
                <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={allowSimilarCreate}
                    onChange={(e) => setAllowSimilarCreate(e.target.checked)}
                  />
                  <span>
                    Hay artículos similares ({similarMatches.map((item) => item.name).join(', ')}).
                    Confirmo crear un artículo nuevo con este nombre.
                  </span>
                </label>
              ) : null}

              {movementType === 'in' && selectedItemId === null ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Datos para artículo nuevo
                      </p>
                      <p className="text-xs text-slate-500">
                        Completa los datos base; la clave se generará automáticamente.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Tipo de artículo
                      </label>
                      <Select
                        value={itemType}
                        onChange={(e) => {
                          setItemType(e.target.value as MovementItemType)
                          setErrors((prev) => ({ ...prev, itemType: undefined }))
                        }}
                        aria-invalid={Boolean(errors.itemType)}
                      >
                        <option value="">Selecciona un tipo</option>
                        {itemTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                      {errors.itemType ? (
                        <p className="mt-1 text-xs text-rose-700">{errors.itemType}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Unidad
                      </label>
                      <Input
                        value={newItemUnidad}
                        onChange={(e) => {
                          setNewItemUnidad(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            newItemUnidad: undefined,
                          }))
                        }}
                        placeholder="Ej. pieza"
                        aria-invalid={Boolean(errors.newItemUnidad)}
                      />
                      {errors.newItemUnidad ? (
                        <p className="mt-1 text-xs text-rose-700">{errors.newItemUnidad}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Proveedor
                      </label>
                      <Input
                        value={newItemProveedor}
                        onChange={(e) => {
                          setNewItemProveedor(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            newItemProveedor: undefined,
                          }))
                        }}
                        placeholder="Nombre de proveedor"
                        aria-invalid={Boolean(errors.newItemProveedor)}
                      />
                      {errors.newItemProveedor ? (
                        <p className="mt-1 text-xs text-rose-700">{errors.newItemProveedor}</p>
                      ) : null}
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Stock mínimo
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
                            aria-label="Ayuda sobre stock mínimo"
                            aria-expanded={stockHelpOpen}
                            onMouseEnter={() => setStockHelpOpen(true)}
                            onMouseLeave={() => setStockHelpOpen(false)}
                            onFocus={() => setStockHelpOpen(true)}
                            onBlur={() => setStockHelpOpen(false)}
                            onClick={() => setStockHelpOpen((value) => !value)}
                          >
                            ?
                          </button>
                          {stockHelpOpen ? (
                            <div
                              role="tooltip"
                              className="absolute left-1/2 top-7 z-20 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] leading-4 text-slate-600 shadow-lg"
                            >
                              Si el inventario queda en este valor o menos, el artículo se
                              marcará como <span className="font-semibold text-rose-700">Bajo</span>.
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={newItemStockMinimo}
                        onChange={(e) => {
                          setNewItemStockMinimo(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            newItemStockMinimo: undefined,
                          }))
                        }}
                        placeholder="0"
                        aria-invalid={Boolean(errors.newItemStockMinimo)}
                      />
                      {errors.newItemStockMinimo ? (
                        <p className="mt-1 text-xs text-rose-700">
                          {errors.newItemStockMinimo}
                        </p>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Descripción del artículo
                      </label>
                      <Textarea
                        value={newItemDescription}
                        onChange={(e) => {
                          setNewItemDescription(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            newItemDescription: undefined,
                          }))
                        }}
                        placeholder="Descripción para registro de artículo"
                        rows={3}
                      />
                      {errors.newItemDescription ? (
                        <p className="mt-1 text-xs text-rose-700">
                          {errors.newItemDescription}
                        </p>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Cuota de recuperación (opcional)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={newItemCuotaRecuperacion}
                        onChange={(e) => {
                          setNewItemCuotaRecuperacion(e.target.value)
                          setErrors((prev) => ({
                            ...prev,
                            newItemCuotaRecuperacion: undefined,
                          }))
                        }}
                        placeholder="Ej. 150.00"
                        aria-invalid={Boolean(errors.newItemCuotaRecuperacion)}
                      />
                      {errors.newItemCuotaRecuperacion ? (
                        <p className="mt-1 text-xs text-rose-700">
                          {errors.newItemCuotaRecuperacion}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
            <div className="border-b border-slate-200/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Movimiento
              </p>
              <p className="text-sm text-slate-600">
                Define qué pasó con el artículo y cuándo ocurrió.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tipo de movimiento
                </label>
                <Select
                  value={movementType}
                  onChange={(e) => {
                    setMovementType(e.target.value as MovementType)
                    setErrors((prev) => ({ ...prev, movementType: undefined }))
                  }}
                  aria-invalid={Boolean(errors.movementType)}
                >
                  <option value="in">Entrada</option>
                  <option value="out">Salida</option>
                </Select>
                {errors.movementType ? (
                  <p className="mt-1 text-sm text-rose-700">{errors.movementType}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cantidad
                </label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value)
                    setErrors((prev) => ({ ...prev, quantity: undefined }))
                  }}
                  placeholder="0"
                  aria-invalid={Boolean(errors.quantity)}
                />
                {errors.quantity ? (
                  <p className="mt-1 text-sm text-rose-700">{errors.quantity}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setErrors((prev) => ({ ...prev, date: undefined }))
                  }}
                  aria-invalid={Boolean(errors.date)}
                />
                {errors.date ? (
                  <p className="mt-1 text-sm text-rose-700">{errors.date}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles del movimiento"
                  rows={8}
                />
              </div>

              {submitError ? (
                <p className="text-sm text-rose-700" role="alert">
                  {submitError}
                </p>
              ) : null}

            </div>
          </section>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" disabled={submitting}>
            {submitting
              ? 'Registrando…'
              : initial
                ? 'Guardar cambios'
                : 'Registrar Movimiento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
