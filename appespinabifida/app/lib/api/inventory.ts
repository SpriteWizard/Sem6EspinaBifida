import type {
  Category,
  CreateProductInput,
  InventoryItem,
  ListInventoryParams,
  ListInventoryResult,
} from '../types/inventory'
import type { MovementItemType } from '../types/movements'

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'all', name: 'Todas las categorias' },
]

const ITEM_TYPE_BY_CATEGORY_ID: Record<string, MovementItemType> = {
  medicamento: 'Medicamento',
  'material medico': 'Material Médico',
  'equipo medico': 'Equipo Médico',
  consumible: 'Consumible',
}

const CATEGORY_ID_BY_ITEM_TYPE: Record<MovementItemType, string> = {
  'Material Médico': 'material medico',
  'Equipo Médico': 'equipo medico',
  Medicamento: 'medicamento',
  Consumible: 'consumible',
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function toQueryString(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = await parseJsonResponse(response)
  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error?: string }).error)
        : `Error HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  return payload as T
}

function toCategoryName(categoryId: string) {
  const compact = categoryId.replace(/\s+/g, ' ').trim()
  if (!compact) return 'Sin categoría'
  return `${compact.charAt(0).toUpperCase()}${compact.slice(1)}`
}

function toInteger(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return fallback
  return Math.floor(numberValue)
}

function toNullableAmount(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Math.max(0, Math.round(parsed * 100) / 100)
}

function toInventoryStatus(value: unknown, quantity: number, stockMinimo: number) {
  if (value === 'in_stock' || value === 'low_stock' || value === 'out_of_stock') {
    return value
  }
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= stockMinimo) return 'low_stock'
  return 'in_stock'
}

function mapInventoryItem(raw: Partial<InventoryItem> & Record<string, unknown>): InventoryItem {
  const categoryId = String(raw.categoryId ?? raw.categoria ?? '').trim() || 'consumible'
  const quantity = Math.max(0, toInteger(raw.quantity ?? raw.inventario_actual, 0))
  const stockMinimo = Math.max(0, toInteger(raw.stockMinimo ?? raw.stock_minimo, 0))

  return {
    id: Math.max(0, toInteger(raw.id, 0)),
    clave: String(raw.clave ?? '').trim() || (Math.max(0, toInteger(raw.id, 0)) > 0 ? `ART${Math.max(0, toInteger(raw.id, 0))}` : null),
    name: String(raw.name ?? raw.nombre ?? 'Sin nombre').trim(),
    categoryId,
    categoryName: String(raw.categoryName ?? toCategoryName(categoryId)),
    description: String(raw.description ?? raw.descripcion ?? '').trim(),
    unidad: String(raw.unidad ?? '').trim() || null,
    proveedor: String(raw.proveedor ?? '').trim() || null,
    stockMinimo,
    cuotaRecuperacion: toNullableAmount(raw.cuotaRecuperacion ?? raw.cuota_recuperacion),
    quantity,
    status: toInventoryStatus(raw.status, quantity, stockMinimo),
  }
}

function mapInventoryListResult(payload: unknown): ListInventoryResult {
  if (payload && typeof payload === 'object' && 'items' in payload) {
    const objectPayload = payload as {
      items?: Array<Partial<InventoryItem> & Record<string, unknown>>
      nextCursor?: string | null
    }

    return {
      items: (objectPayload.items ?? []).map((item) => mapInventoryItem(item)),
      nextCursor: objectPayload.nextCursor ?? null,
    }
  }

  const items = Array.isArray(payload)
    ? payload.map((item) => mapInventoryItem(item as Partial<InventoryItem> & Record<string, unknown>))
    : []

  return {
    items,
    nextCursor: null,
  }
}

function scoreSearchHit(itemName: string, normalizedQuery: string): number {
  const normalizedName = normalize(itemName)
  if (normalizedName === normalizedQuery) return 0
  if (normalizedName.startsWith(normalizedQuery)) return 1
  if (normalizedName.includes(normalizedQuery)) return 2
  return 3
}

function levenshteinDistance(a: string, b: string) {
  if (!a) return b.length
  if (!b) return a.length

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  )

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost,
      )
    }
  }

  return matrix[a.length][b.length]
}

export async function listCategories(): Promise<Category[]> {
  try {
    const categories = await requestJson<Category[]>('/api/inventario/obtener/categorias')
    return categories.length ? categories : FALLBACK_CATEGORIES
  } catch {
    return FALLBACK_CATEGORIES
  }
}

export function categoryIdFromMovementItemType(itemType: MovementItemType) {
  return CATEGORY_ID_BY_ITEM_TYPE[itemType]
}

export function movementItemTypeFromCategoryId(categoryId: string): MovementItemType {
  return ITEM_TYPE_BY_CATEGORY_ID[normalize(categoryId)] ?? 'Consumible'
}

export async function getInventoryItemById(id: number): Promise<InventoryItem | null> {
  const query = toQueryString({ id, limit: 1 })
  const payload = await requestJson<unknown>(`/api/inventario/obtener/inventario${query}`)
  const result = mapInventoryListResult(payload)
  return result.items[0] ?? null
}

export async function getInventorySnapshot(): Promise<InventoryItem[]> {
  const snapshot: InventoryItem[] = []
  let cursor: string | null = null

  for (let i = 0; i < 20; i += 1) {
    const page = await listInventory({
      categoryId: 'all',
      search: '',
      cursor,
      limit: 250,
    })
    snapshot.push(...page.items)

    if (!page.nextCursor || page.nextCursor === cursor) {
      break
    }
    cursor = page.nextCursor
  }

  return snapshot
}

export async function findInventoryItemByExactName(
  name: string,
): Promise<InventoryItem | null> {
  const snapshot = await getInventorySnapshot()
  const normalizedName = normalize(name)
  if (!normalizedName) return null
  const found = snapshot.find((item) => normalize(item.name) === normalizedName)
  return found ?? null
}

export async function findSimilarInventoryItemsByName(
  name: string,
  limit = 5,
): Promise<InventoryItem[]> {
  const snapshot = await getInventorySnapshot()
  const normalizedName = normalize(name)
  if (!normalizedName) return []

  const matches = snapshot.map((item) => {
    const normalizedItemName = normalize(item.name)
    const distance = levenshteinDistance(normalizedName, normalizedItemName)
    const maxLength = Math.max(normalizedName.length, normalizedItemName.length)
    const similarityThreshold = Math.max(1, Math.floor(maxLength * 0.25))
    const appearsSimilar =
      normalizedItemName.includes(normalizedName) ||
      normalizedName.includes(normalizedItemName) ||
      distance <= similarityThreshold

    return {
      item,
      appearsSimilar,
      distance,
      normalizedItemName,
    }
  })
    .filter((entry) => entry.appearsSimilar)
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance
      return a.normalizedItemName.localeCompare(b.normalizedItemName)
    })
    .slice(0, limit)

  return matches.map((entry) => entry.item)
}

export async function searchInventoryItemsByName(
  query: string,
  limit = 8,
): Promise<InventoryItem[]> {
  const result = await listInventory({
    categoryId: 'all',
    search: query,
    cursor: null,
    limit: Math.max(1, limit),
  })

  const normalizedQuery = normalize(query)

  return result.items
    .sort((a, b) => {
      if (normalizedQuery) {
        const scoreA = scoreSearchHit(a.name, normalizedQuery)
        const scoreB = scoreSearchHit(b.name, normalizedQuery)
        if (scoreA !== scoreB) return scoreA - scoreB
      }

      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}

export async function updateInventoryItemQuota(
  itemId: number,
  cuotaRecuperacion: number | null,
): Promise<InventoryItem> {
  return updateInventoryItemSettings(itemId, cuotaRecuperacion)
}

export async function updateInventoryItemSettings(
  itemId: number,
  cuotaRecuperacion: number | null,
  stockMinimo?: number | null,
): Promise<InventoryItem> {
  const payload = await requestJson<unknown>('/api/inventario/editar/cuota', {
    method: 'PUT',
    body: JSON.stringify({
      itemId,
      cuotaRecuperacion,
      stockMinimo,
    }),
  })
  return mapInventoryItem(payload as Partial<InventoryItem> & Record<string, unknown>)
}

export async function listInventory(
  params: ListInventoryParams,
): Promise<ListInventoryResult> {
  const { search = '', categoryId = 'all', cursor, limit = 5 } = params

  const query = toQueryString({
    search,
    categoryId,
    cursor,
    limit,
  })

  const payload = await requestJson<unknown>(`/api/inventario/obtener/inventario${query}`)
  return mapInventoryListResult(payload)
}

export async function createProduct(
  input: CreateProductInput,
): Promise<InventoryItem> {
  const payload = await requestJson<unknown>('/api/inventario/agregar/articulo', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      categoryId: input.categoryId,
      description: input.description,
      unidad: input.unidad,
      proveedor: input.proveedor,
      stockMinimo: input.stockMinimo,
      cuotaRecuperacion: input.cuotaRecuperacion,
      quantity: input.quantity,
    }),
  })

  return mapInventoryItem(payload as Partial<InventoryItem> & Record<string, unknown>)
}
