import {
  categoryIdFromMovementItemType,
  createProduct,
  findInventoryItemByExactName,
  findSimilarInventoryItemsByName,
  getInventoryItemById,
  listCategories,
  movementItemTypeFromCategoryId,
} from './inventory'
import type {
  CreateMovementInput,
  InventoryMovement,
  ListMovementsParams,
  ListMovementsResult,
  MovementItemType,
} from '../types/movements'

const KNOWN_ITEM_TYPES: MovementItemType[] = [
  'Material Médico',
  'Equipo Médico',
  'Medicamento',
  'Consumible',
]

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

function asPositiveQuantity(rawQuantity: number) {
  const quantity = Math.floor(Number(rawQuantity))
  if (Number.isNaN(quantity) || quantity <= 0) {
    throw new Error('Indica una cantidad válida (mayor a 0).')
  }
  return quantity
}

function formatSimilarList(names: string[]) {
  if (names.length === 0) return ''
  return names.join(', ')
}

function mapMovementItemType(value: unknown): MovementItemType {
  const normalized = normalize(String(value ?? ''))
  if (normalized === 'material medico') return 'Material Médico'
  if (normalized === 'equipo medico') return 'Equipo Médico'
  if (normalized === 'medicamento') return 'Medicamento'
  return 'Consumible'
}

function mapMovement(raw: Partial<InventoryMovement> & Record<string, unknown>): InventoryMovement {
  const userFirstName = String(raw.userFirstName ?? raw.first_name ?? '').trim() || null
  const userLastName = String(raw.userLastName ?? raw.last_name ?? '').trim() || null
  const userEmail = String(raw.userEmail ?? raw.email ?? raw.correo ?? '').trim() || null
  const userName =
    String(raw.userName ?? raw.full_name ?? raw.name ?? '').trim() ||
    [userFirstName, userLastName].filter(Boolean).join(' ').trim() ||
    null

  return {
    id: Math.max(0, Math.floor(Number(raw.id ?? 0))),
    itemId:
      raw.itemId === null || raw.itemId === undefined
        ? null
        : Math.max(0, Math.floor(Number(raw.itemId))),
    itemName: String(raw.itemName ?? 'Articulo sin nombre').trim(),
    itemType: mapMovementItemType(raw.itemType),
    date: String(raw.date ?? '').slice(0, 10),
    movementType: raw.movementType === 'in' ? 'in' : 'out',
    quantity: Math.max(0, Math.floor(Number(raw.quantity ?? 0))),
    notes: String(raw.notes ?? '').trim(),
    userId:
      raw.userId === null || raw.userId === undefined
        ? null
        : Math.max(0, Math.floor(Number(raw.userId))),
    userName,
    userEmail,
    userFirstName,
    userLastName,
    userRole: String(raw.userRole ?? raw.createdByRole ?? '').trim() || null,
  }
}

function mapMovementListResult(payload: unknown): ListMovementsResult {
  if (payload && typeof payload === 'object' && 'items' in payload) {
    const objectPayload = payload as {
      items?: Array<Partial<InventoryMovement> & Record<string, unknown>>
      nextCursor?: string | null
    }

    return {
      items: (objectPayload.items ?? []).map((item) => mapMovement(item)),
      nextCursor: objectPayload.nextCursor ?? null,
    }
  }

  const items = Array.isArray(payload)
    ? payload.map((item) => mapMovement(item as Partial<InventoryMovement> & Record<string, unknown>))
    : []

  return {
    items,
    nextCursor: null,
  }
}

export async function listMovementItemTypes(): Promise<MovementItemType[]> {
  try {
    const categories = await listCategories()
    const mapped = categories
      .filter((category) => category.id !== 'all')
      .map((category) => movementItemTypeFromCategoryId(category.id))

    return Array.from(new Set([...KNOWN_ITEM_TYPES, ...mapped]))
  } catch {
    return KNOWN_ITEM_TYPES
  }
}

export async function listMovements(
  params: ListMovementsParams,
): Promise<ListMovementsResult> {
  const {
    search = '',
    movementType = 'all',
    itemType = 'all',
    itemId,
    itemName = '',
    date = '',
    dateFrom = '',
    dateTo = '',
    cursor,
    limit = 6,
  } = params

  const query = toQueryString({
    search,
    movementType,
    itemType,
    itemId,
    itemName,
    date,
    dateFrom,
    dateTo,
    cursor,
    limit,
  })

  const payload = await requestJson<unknown>(`/api/inventario/movimientos/obtener${query}`)
  return mapMovementListResult(payload)
}

export async function createMovement(
  input: CreateMovementInput,
): Promise<InventoryMovement> {
  if (!KNOWN_ITEM_TYPES.includes(input.itemType)) {
    throw new Error('Selecciona un tipo de artículo válido.')
  }

  const qty = asPositiveQuantity(input.quantity)

  let resolvedItem =
    input.itemId !== undefined ? await getInventoryItemById(input.itemId) : null

  const trimmedName = input.itemName.trim()

  if (!resolvedItem && trimmedName) {
    const exactByName = await findInventoryItemByExactName(trimmedName)
    if (exactByName) {
      resolvedItem = exactByName
    }
  }

  if (input.movementType === 'out' && !resolvedItem) {
    throw new Error('Para salida debes seleccionar un artículo existente.')
  }

  if (input.movementType === 'in' && !resolvedItem) {
    if (!trimmedName) {
      throw new Error('Indica el nombre del artículo.')
    }

    const similar = await findSimilarInventoryItemsByName(trimmedName, 4)
    if (similar.length > 0 && !input.allowSimilarCreate) {
      const similarNames = similar.map((item) => item.name)
      throw new Error(
        `Se encontraron artículos similares: ${formatSimilarList(similarNames)}. Selecciona una sugerencia o confirma crear uno nuevo.`,
      )
    }

    const newItemUnidad = input.newItemUnidad?.trim() ?? ''
    const newItemProveedor = input.newItemProveedor?.trim() ?? ''
    const newItemDescription = input.newItemDescription?.trim() ?? ''
    const newItemStockMinimo = Math.floor(Number(input.newItemStockMinimo ?? 0))

    if (!newItemUnidad) {
      throw new Error('La unidad del articulo nuevo es obligatoria.')
    }
    if (!newItemProveedor) {
      throw new Error('El proveedor del articulo nuevo es obligatorio.')
    }
    if (Number.isNaN(newItemStockMinimo) || newItemStockMinimo < 0) {
      throw new Error('Stock minimo invalido para el articulo nuevo.')
    }

    const created = await createProduct({
      name: trimmedName,
      categoryId: categoryIdFromMovementItemType(input.itemType),
      description: newItemDescription || 'Sin descripcion',
      unidad: newItemUnidad,
      proveedor: newItemProveedor,
      stockMinimo: newItemStockMinimo,
      cuotaRecuperacion: input.newItemCuotaRecuperacion ?? null,
      quantity: 0,
    })

    resolvedItem = created
  }

  if (!resolvedItem) {
    throw new Error('No se pudo resolver el artículo para registrar el movimiento.')
  }

  const createdMovementRaw = await requestJson<unknown>('/api/inventario/movimientos/agregar', {
    method: 'POST',
    body: JSON.stringify({
      itemId: resolvedItem.id,
      movementType: input.movementType,
      date: input.date,
      quantity: qty,
      notes: input.notes.trim(),
    }),
  })

  const createdMovement = mapMovement(
    createdMovementRaw as Partial<InventoryMovement> & Record<string, unknown>,
  )

  return {
    ...createdMovement,
    itemId: createdMovement.itemId ?? resolvedItem.id,
    itemName: createdMovement.itemName || resolvedItem.name,
    itemType:
      createdMovement.itemType ||
      movementItemTypeFromCategoryId(resolvedItem.categoryId),
    notes: createdMovement.notes || input.notes.trim(),
    date: createdMovement.date || input.date,
  }
}

