import {
  extractOrdsItems,
  fetchOrdsJsonCandidates,
  getCandidatePaths,
  toInventoryItem,
} from '@/lib/server/inventory-ords'
import type { InventoryItem } from '@/lib/types/inventory'

const DEFAULT_UPDATE_PATHS = [
  'inventario/actualizarArticulo',
  'inventario/actualizarCuotaArticulo',
  'inventario/editarArticulo',
]
const DEFAULT_LIST_PATHS = ['inventario/obtenerInventario']

type UpdateQuotaBody = {
  itemId?: number
  cuotaRecuperacion?: number | null
  stockMinimo?: number | null
}

function asNullableAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Math.max(0, Math.round(parsed * 100) / 100)
}

async function fetchInventoryItemById(itemId: number): Promise<InventoryItem | null> {
  const listPaths = getCandidatePaths('ORDS_INVENTORY_LIST_PATHS', DEFAULT_LIST_PATHS)
  const { data } = await fetchOrdsJsonCandidates(listPaths, {
    method: 'GET',
  })

  const items = extractOrdsItems(data).map((row) => toInventoryItem(row))
  return items.find((item) => item.id === itemId) ?? null
}

async function persistItemSettings(payload: {
  id_articulo: number
  cuota_recuperacion: number | null
  stock_minimo?: number | null
}) {
  const updatePaths = getCandidatePaths('ORDS_INVENTORY_UPDATE_PATHS', DEFAULT_UPDATE_PATHS)
  let lastError: unknown = null

  for (const method of ['PUT', 'POST'] as const) {
    try {
      await fetchOrdsJsonCandidates(updatePaths, {
        method,
        body: JSON.stringify(payload),
      })
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('No se pudo persistir el articulo actualizado.')
}

async function handleUpdate(request: Request) {
  try {
    const body = (await request.json()) as UpdateQuotaBody
    const itemId = Math.floor(Number(body.itemId))

    if (Number.isNaN(itemId) || itemId <= 0) {
      return Response.json({ error: 'itemId es requerido y debe ser valido.' }, { status: 400 })
    }

    const cuotaRecuperacion = asNullableAmount(body.cuotaRecuperacion)
    if (body.cuotaRecuperacion !== null && body.cuotaRecuperacion !== undefined && cuotaRecuperacion === null) {
      return Response.json(
        { error: 'cuotaRecuperacion debe ser un numero valido o null.' },
        { status: 400 },
      )
    }

    const stockMinimo =
      body.stockMinimo === undefined
        ? undefined
        : body.stockMinimo === null
          ? null
          : Math.max(0, Math.floor(Number(body.stockMinimo)))
    if (
      body.stockMinimo !== null &&
      body.stockMinimo !== undefined &&
      Number.isNaN(stockMinimo)
    ) {
      return Response.json(
        { error: 'stockMinimo debe ser un numero valido o null.' },
        { status: 400 },
      )
    }

    await persistItemSettings({
      id_articulo: itemId,
      cuota_recuperacion: cuotaRecuperacion,
      ...(stockMinimo === undefined ? {} : { stock_minimo: stockMinimo }),
    })

    const updated = await fetchInventoryItemById(itemId)
    if (!updated) {
      throw new Error('Cuota guardada, pero no se pudo recuperar el articulo actualizado.')
    }

    return Response.json(updated)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo actualizar la cuota de recuperacion.'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  return handleUpdate(request)
}

export async function POST(request: Request) {
  return handleUpdate(request)
}
