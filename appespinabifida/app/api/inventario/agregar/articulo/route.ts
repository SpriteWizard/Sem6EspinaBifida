import {
  extractOrdsItems,
  fetchOrdsJsonCandidates,
  getCandidatePaths,
  normalizeText,
  toInventoryItem,
} from '@/lib/server/inventory-ords'
import type { InventoryItem } from '@/lib/types/inventory'

const DEFAULT_CREATE_PATHS = [
  'inventario/agregarArticulo',
  'inventario/crearArticulo',
]
const DEFAULT_LIST_PATHS = ['inventario/obtenerInventario']

type CreateArticleBody = {
  name?: string | null
  categoryId?: string | null
  description?: string | null
  unidad?: string | null
  proveedor?: string | null
  stockMinimo?: number | null
  cuotaRecuperacion?: number | null
  quantity?: number | null
}

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function asNonNegativeInteger(value: unknown, fallback = 0) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return fallback
  return Math.max(0, Math.floor(parsed))
}

function asNullableAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Math.max(0, Math.round(parsed * 100) / 100)
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function findCreatedItem(
  name: string,
  categoryId: string,
): Promise<InventoryItem | null> {
  const listPaths = getCandidatePaths('ORDS_INVENTORY_LIST_PATHS', DEFAULT_LIST_PATHS)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data } = await fetchOrdsJsonCandidates(listPaths, {
      method: 'GET',
    })

    const inventoryItems = extractOrdsItems(data).map((row) => toInventoryItem(row))
    const normalizedName = normalizeText(name)
    const normalizedCategory = normalizeText(categoryId)

    const byNameAndCategory = inventoryItems.find(
      (item) =>
        normalizeText(item.name) === normalizedName &&
        normalizeText(item.categoryId) === normalizedCategory,
    )
    if (byNameAndCategory) return byNameAndCategory

    await sleep(150)
  }

  return null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateArticleBody

    const name = asText(body.name)
    const categoryId = normalizeText(asText(body.categoryId))

    if (!name) {
      return Response.json({ error: 'El nombre del articulo es obligatorio.' }, { status: 400 })
    }

    if (!categoryId || categoryId === 'all') {
      return Response.json({ error: 'La categoria del articulo es obligatoria.' }, { status: 400 })
    }

    const payload = {
      nombre: name,
      categoria: categoryId,
      descripcion: asText(body.description),
      unidad: asText(body.unidad),
      proveedor: asText(body.proveedor),
      stock_minimo: asNonNegativeInteger(body.stockMinimo, 0),
      inventario_actual: asNonNegativeInteger(body.quantity, 0),
      cuota_recuperacion: asNullableAmount(body.cuotaRecuperacion),
    }

    const createPaths = getCandidatePaths('ORDS_INVENTORY_CREATE_PATHS', DEFAULT_CREATE_PATHS)
    await fetchOrdsJsonCandidates(createPaths, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const createdItem = await findCreatedItem(name, categoryId)
    if (!createdItem) {
      throw new Error(
        'Articulo creado, pero no se pudo confirmar su registro en la lista actual.',
      )
    }

    return Response.json(
      {
        ...createdItem,
        clave: `ART${createdItem.id}`,
      },
      { status: 201 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo crear el articulo real.'
    return Response.json({ error: message }, { status: 500 })
  }
}
