'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Search } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { MovementHistoryList } from '../../components/inventory/MovementHistoryList'
import { NewMovementModal } from '../../components/inventory/NewMovementModal'
import { listMovementItemTypes, listMovements } from '../../lib/api/movements'
import type {
  InventoryMovement,
  MovementItemType,
  MovementListFilter,
  MovementType,
} from '../../lib/types/movements'

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export default function InventoryMovementsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consumedSalidaRef = useRef(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)

  const [movementType, setMovementType] = useState<MovementListFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [itemTypes, setItemTypes] = useState<MovementItemType[]>([])

  const [items, setItems] = useState<InventoryMovement[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMovementOpen, setNewMovementOpen] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [editingMovement, setEditingMovement] = useState<InventoryMovement | null>(null)
  const [preselectedItem, setPreselectedItem] = useState<{ id: number; name: string } | undefined>(undefined)
  const [fixedMovementType, setFixedMovementType] = useState<MovementType | undefined>(undefined)

  const movementTypeSelectValue = movementType === 'all' ? '' : movementType
  const movementTypeIsPlaceholder = movementType === 'all'

  const queryKey = useMemo(
    () => `${movementType}__${dateFrom}__${dateTo}__${debouncedSearch}`,
    [movementType, dateFrom, dateTo, debouncedSearch],
  )

  useEffect(() => {
    if (consumedSalidaRef.current) return
    const entradaId = searchParams.get('entrada')
    const entradaNombre = searchParams.get('nombre')
    if (!entradaId || !entradaNombre) return
    consumedSalidaRef.current = true
    setPreselectedItem({ id: Number(entradaId), name: entradaNombre })
    setFixedMovementType('in')
    setNewMovementOpen(true)
    router.replace('/inventory/movimientos')
  }, [searchParams])

  useEffect(() => {
    let alive = true
    listMovementItemTypes()
      .then((types) => {
        if (!alive) return
        setItemTypes(types)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    listMovements({
      search: debouncedSearch,
      movementType,
      dateFrom,
      dateTo,
      cursor: null,
      limit: 6,
    })
      .then((res) => {
        if (!alive) return
        setItems(res.items)
        setNextCursor(res.nextCursor)
      })
      .catch((error) => {
        if (!alive) return
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el historial de movimientos.',
        )
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [queryKey, movementType, dateFrom, dateTo, debouncedSearch])

  async function onLoadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const res = await listMovements({
        search: debouncedSearch,
        movementType,
        dateFrom,
        dateTo,
        cursor: nextCursor,
        limit: 6,
      })
      setItems((prev) => [...prev, ...res.items])
      setNextCursor(res.nextCursor)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'No se pudo cargar más datos.',
      )
    } finally {
      setLoadingMore(false)
    }
  }

  function resetFilters() {
    setSearch('')
    setMovementType('all')
    setDateFrom('')
    setDateTo('')
    setError(null)
  }

  function handleCreated(m: InventoryMovement) {
    setItems((prev) => [m, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
          Movimientos de Inventario
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push('/inventory')}
          >
            Volver a Inventario
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingMovement(null)
              setNewMovementOpen(true)
            }}
          >
            Agregar
          </Button>
          <Button variant="secondary" onClick={resetFilters}>
            Reset filtros
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar movimientos..."
              aria-label="Buscar movimientos"
              className="pl-9"
            />
          </div>

          <div className="relative md:col-span-3">
            <Select
              value={movementTypeSelectValue}
              onChange={(e) => {
                const v = e.target.value
                if (!v) setMovementType('all')
                else if (v === 'out_comodato') setMovementType('out_comodato')
                else setMovementType(v as MovementType)
              }}
              aria-label="Filtrar por tipo"
              className={movementTypeIsPlaceholder ? 'text-slate-400' : 'text-slate-900'}
            >
              <option value="" disabled>
                Tipo de movimiento
              </option>
              <option value="in">Entrada</option>
              <option value="out">Salida</option>
              <option value="out_comodato">Salida (Solo Comodatos)</option>
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              ▼
            </span>
          </div>

          <div className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-slate-500">Desde</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Filtrar desde"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-slate-500">Hasta</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Filtrar hasta"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <div className="rounded-t-2xl bg-slate-600 px-4 py-4 text-white">
          <h2 className="text-lg font-semibold">
            Historial de Movimientos
          </h2>
        </div>
        <MovementHistoryList
          items={items}
          loading={loading}
          error={error}
          onEdit={(m) => {
            setEditingMovement(m)
            setViewOnly(true)
            setNewMovementOpen(true)
          }}
        />
        <div className="flex justify-center p-5">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={!nextCursor || loading || loadingMore}
          >
            {loadingMore ? 'Cargando…' : 'Cargar más datos'}
          </Button>
        </div>
      </div>

      <NewMovementModal
        open={newMovementOpen}
        onClose={() => {
          setNewMovementOpen(false)
          setViewOnly(false)
          setEditingMovement(null)
          setPreselectedItem(undefined)
          setFixedMovementType(undefined)
        }}
        itemTypes={itemTypes}
        onCreated={handleCreated}
        initial={editingMovement}
        viewOnly={viewOnly}
        preselectedItem={preselectedItem}
        fixedMovementType={fixedMovementType}
      />
    </div>
  )
}

