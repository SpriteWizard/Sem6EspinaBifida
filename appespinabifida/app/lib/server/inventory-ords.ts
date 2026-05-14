import type { InventoryItem, InventoryStatus } from '@/lib/types/inventory'
import type {
  InventoryMovement,
  MovementItemType,
  MovementType,
} from '@/lib/types/movements'

const DEFAULT_ORDS_BASE_URL =
  'https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin'

const ORDS_BASE_URL = (process.env.ORDS_BASE_URL ?? DEFAULT_ORDS_BASE_URL).replace(
  /\/+$/,
  '',
)

type JsonObject = Record<string, unknown>

const MOVEMENT_ITEM_TYPE_BY_CATEGORY_ID: Record<string, MovementItemType> = {
  medicamento: 'Medicamento',
  'material medico': 'Material Médico',
  'equipo medico': 'Equipo Médico',
  consumible: 'Consumible',
}

function toStringValue(value: unknown) {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function toNullableNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return parsed
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function sentenceCase(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (!compact) return 'Sin categoria'
  return `${compact.charAt(0).toUpperCase()}${compact.slice(1)}`
}

function toInventoryStatus(quantity: number, stockMinimo: number): InventoryStatus {
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= stockMinimo) return 'low_stock'
  return 'in_stock'
}

function toMovementType(value: unknown): MovementType {
  const normalized = normalizeText(toStringValue(value))
  if (normalized === 'entrada' || normalized === 'in') return 'in'
  return 'out'
}

function toMovementItemType(categoryId: string): MovementItemType {
  return MOVEMENT_ITEM_TYPE_BY_CATEGORY_ID[normalizeText(categoryId)] ?? 'Consumible'
}

function toIsoDate(value: unknown) {
  const raw = toStringValue(value).trim()
  if (!raw) return new Date().toISOString().slice(0, 10)

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return raw.slice(0, 10)
}

function getRowValue<T>(row: JsonObject, keys: string[], fallback: T): T {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key] as T
    }
  }
  return fallback
}

export function toInventoryItem(row: JsonObject): InventoryItem {
  const id = Math.floor(
    toNumberValue(getRowValue(row, ['id_articulo', 'idArticulo', 'ID_ARTICULO', 'id'], 0), 0),
  )
  const name = toStringValue(
    getRowValue(row, ['nombre', 'name', 'NOMBRE', 'articulo_nombre', 'item_name'], ''),
  ).trim()
  const categoryId = toStringValue(
    getRowValue(row, ['categoria', 'category', 'category_id', 'CATEGORIA'], ''),
  ).trim()
  const description = toStringValue(
    getRowValue(row, ['descripcion', 'description', 'DESCRIPCION'], ''),
  ).trim()
  const quantity = Math.max(
    0,
    Math.floor(
      toNumberValue(
        getRowValue(row, ['inventario_actual', 'quantity', 'INVENTARIO_ACTUAL'], 0),
        0,
      ),
    ),
  )
  const stockMinimo = Math.max(
    0,
    Math.floor(
      toNumberValue(
        getRowValue(row, ['stock_minimo', 'stockMinimo', 'STOCK_MINIMO'], 0),
        0,
      ),
    ),
  )

  const explicitStatus = toStringValue(getRowValue(row, ['status', 'STATUS'], '')).trim()
  const status: InventoryStatus =
    explicitStatus === 'in_stock' ||
    explicitStatus === 'low_stock' ||
    explicitStatus === 'out_of_stock'
      ? explicitStatus
      : toInventoryStatus(quantity, stockMinimo)

  return {
    id,
    clave: toStringValue(getRowValue(row, ['clave', 'CLAVE'], '')).trim() || (id > 0 ? `ART${id}` : null),
    name: name || 'Sin nombre',
    categoryId,
    categoryName: sentenceCase(categoryId),
    description,
    unidad:
      toStringValue(getRowValue(row, ['unidad', 'UNIDAD'], '')).trim() || null,
    proveedor:
      toStringValue(getRowValue(row, ['proveedor', 'PROVEEDOR'], '')).trim() || null,
    stockMinimo,
    cuotaRecuperacion: toNullableNumberValue(
      getRowValue(row, ['cuota_recuperacion', 'cuotaRecuperacion', 'CUOTA_RECUPERACION'], null),
    ),
    quantity,
    status,
  }
}

export function toInventoryMovement(
  row: JsonObject,
  inventoryById?: Map<number, InventoryItem>,
): InventoryMovement {
  const id = Math.floor(
    toNumberValue(
      getRowValue(row, ['id_movimiento', 'idMovimiento', 'ID_MOVIMIENTO', 'id'], 0),
      0,
    ),
  )
  const itemIdRaw = toNullableNumberValue(
    getRowValue(row, ['id_articulo', 'idArticulo', 'ID_ARTICULO', 'item_id'], null),
  )
  const itemId = itemIdRaw === null ? null : Math.floor(itemIdRaw)
  const relatedItem = itemId === null ? undefined : inventoryById?.get(itemId)

  const categoryId = toStringValue(
    getRowValue(row, ['categoria', 'item_category', 'CATEGORIA'], relatedItem?.categoryId ?? ''),
  ).trim()

  const itemNameFromRow = toStringValue(
    getRowValue(
      row,
      ['item_name', 'articulo_nombre', 'nombre', 'NOMBRE', 'itemName'],
      '',
    ),
  ).trim()

  return {
    id,
    itemId,
    itemName:
      itemNameFromRow ||
      relatedItem?.name ||
      (itemId === null ? 'Articulo sin referencia' : `Articulo ${itemId}`),
    itemType: toMovementItemType((categoryId || relatedItem?.categoryId) ?? ''),
    date: toIsoDate(getRowValue(row, ['fecha', 'date', 'FECHA'], '')),
    movementType: toMovementType(getRowValue(row, ['tipo', 'movement_type', 'TIPO'], '')),
    quantity: Math.max(
      0,
      Math.floor(
        toNumberValue(getRowValue(row, ['cantidad', 'quantity', 'CANTIDAD'], 0), 0),
      ),
    ),
    notes: toStringValue(getRowValue(row, ['notas', 'notes', 'NOTAS'], '')).trim(),
    userId: toNullableNumberValue(
      getRowValue(row, ['id_usuario', 'idUsuario', 'usuario_id', 'userId'], null),
    ),
    userName:
      toStringValue(
        getRowValue(
          row,
          ['usuario_nombre', 'nombre_usuario', 'user_name', 'full_name', 'nombreCompleto'],
          '',
        ),
      ).trim() || null,
    userEmail:
      toStringValue(getRowValue(row, ['correo', 'email', 'correo_usuario', 'user_email'], '')).trim() || null,
    userFirstName:
      toStringValue(
        getRowValue(row, ['nombre', 'nombres', 'first_name', 'usuario_nombre'], ''),
      ).trim() || null,
    userLastName:
      toStringValue(
        getRowValue(row, ['apellidos', 'apellido', 'last_name', 'usuario_apellidos'], ''),
      ).trim() || null,
    userRole:
      toStringValue(getRowValue(row, ['usuario_rol', 'user_role', 'rol', 'role'], '')).trim() || null,
  }
}

export function toOrdsUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${ORDS_BASE_URL}/${path.replace(/^\/+/, '')}`
}

export function getCandidatePaths(envVariable: string, defaults: string[]) {
  const raw = process.env[envVariable]
  if (!raw) return defaults
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return parsed.length ? parsed : defaults
}

function getAuthHeaders() {
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw new Error('DB_USER/DB_PASSWORD no estan configurados.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization:
      'Basic ' +
      Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString('base64'),
  }
}

async function parseResponseBody(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function stringifyBody(body: unknown) {
  if (typeof body === 'string') return body
  if (body === null || body === undefined) return ''
  try {
    return JSON.stringify(body)
  } catch {
    return String(body)
  }
}

export async function fetchOrdsJsonCandidates(
  paths: string[],
  init: RequestInit,
): Promise<{ data: unknown; url: string }> {
  let lastError = 'No se pudo contactar ORDS.'

  for (const path of paths) {
    const url = toOrdsUrl(path)
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        ...getAuthHeaders(),
        ...(init.headers ?? {}),
      },
    })

    const payload = await parseResponseBody(response)

    if (response.ok) {
      return {
        data: payload,
        url,
      }
    }

    if (response.status === 404 || response.status === 405) {
      lastError = `Endpoint ORDS no disponible en ${url}.`
      continue
    }

    lastError = `Error ORDS ${response.status} en ${url}: ${stringifyBody(payload)}`
    break
  }

  throw new Error(lastError)
}

export function extractOrdsItems(data: unknown): JsonObject[] {
  if (Array.isArray(data)) {
    return data.filter((entry): entry is JsonObject => !!entry && typeof entry === 'object')
  }

  if (data && typeof data === 'object' && Array.isArray((data as JsonObject).items)) {
    return ((data as JsonObject).items as unknown[]).filter(
      (entry): entry is JsonObject => !!entry && typeof entry === 'object',
    )
  }

  return []
}
