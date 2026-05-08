import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-options'
import { getUserById } from '@/lib/db/user'
import {
  extractOrdsItems,
  fetchOrdsJsonCandidates,
  getCandidatePaths,
  normalizeText,
  toInventoryItem,
  toInventoryMovement,
} from '@/lib/server/inventory-ords'
import type { InventoryMovement } from '@/lib/types/movements'

const DEFAULT_MOVEMENTS_CREATE_PATHS = [
  'inventario/agregarMovimiento',
  'inventario/crearMovimiento',
  'inventario/registrarMovimiento',
  'inventario/agregarMovimientoInventario',
]
const DEFAULT_MOVEMENTS_LIST_PATHS = [
  'inventario/obtenerMovimientos',
  'inventario/listarMovimientos',
  'inventario/movimientos',
]
const DEFAULT_INVENTORY_LIST_PATHS = ['inventario/obtenerInventario']

type CreateMovementBody = {
  itemId?: number
  date?: string
  movementType?: 'in' | 'out'
  quantity?: number
  notes?: string
}

function asPositiveInteger(value: unknown) {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return Math.floor(parsed)
}

function toMovementDbType(value: 'in' | 'out') {
  return value === 'in' ? 'entrada' : 'salida'
}

function toApiDate(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return new Date().toISOString().slice(0, 10)

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return text.slice(0, 10)
}

function toResponseMovementType(value: 'in' | 'out') {
  return value
}

async function getInventoryMap() {
  const inventoryPaths = getCandidatePaths('ORDS_INVENTORY_LIST_PATHS', DEFAULT_INVENTORY_LIST_PATHS)
  const { data } = await fetchOrdsJsonCandidates(inventoryPaths, {
    method: 'GET',
  })

  return new Map(
    extractOrdsItems(data)
      .map((row) => toInventoryItem(row))
      .map((item) => [item.id, item] as const),
  )
}

async function tryResolveCreatedMovement(
  itemId: number,
  movementType: 'in' | 'out',
  quantity: number,
  date: string,
) {
  const movementPaths = getCandidatePaths(
    'ORDS_MOVEMENTS_LIST_PATHS',
    DEFAULT_MOVEMENTS_LIST_PATHS,
  )

  const [inventoryMap, movementResult] = await Promise.all([
    getInventoryMap(),
    fetchOrdsJsonCandidates(movementPaths, {
      method: 'GET',
    }),
  ])

  const movements = extractOrdsItems(movementResult.data)
    .map((row) => toInventoryMovement(row, inventoryMap))
    .sort((a, b) => b.id - a.id)

  return (
    movements.find(
      (movement) =>
        movement.itemId === itemId &&
        movement.movementType === toResponseMovementType(movementType) &&
        movement.quantity === quantity &&
        normalizeText(movement.date) === normalizeText(date),
    ) ?? null
  )
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = asPositiveInteger((session?.user as { id?: string } | undefined)?.id)
    const userRole = (session?.user as { role?: string } | undefined)?.role
    const userName = (session?.user as { name?: string; email?: string } | undefined)?.name ??
      (session?.user as { email?: string } | undefined)?.email ??
      'Usuario'
    const userProfile = userId ? await getUserById(userId).catch(() => null) : null

    if (!userId || !userRole) {
      return Response.json(
        { error: 'No hay sesion valida con usuario y rol para registrar el movimiento.' },
        { status: 401 },
      )
    }

    const body = (await request.json()) as CreateMovementBody

    const itemId = asPositiveInteger(body.itemId)
    const quantity = asPositiveInteger(body.quantity)
    const movementType = body.movementType

    if (!itemId) {
      return Response.json(
        { error: 'itemId es obligatorio para crear el movimiento.' },
        { status: 400 },
      )
    }

    if (!quantity) {
      return Response.json(
        { error: 'quantity debe ser un numero entero mayor a 0.' },
        { status: 400 },
      )
    }

    if (movementType !== 'in' && movementType !== 'out') {
      return Response.json(
        { error: 'movementType debe ser in o out.' },
        { status: 400 },
      )
    }

    const date = toApiDate(body.date)
    const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

    const payload = {
      id_articulo: itemId,
      id_usuario: userId,
      id_recibo: null,
      fecha: `${date}T00:00:00`,
      tipo: toMovementDbType(movementType),
      cantidad: quantity,
      notas: notes || null,
    }

    const createPaths = getCandidatePaths(
      'ORDS_MOVEMENTS_CREATE_PATHS',
      DEFAULT_MOVEMENTS_CREATE_PATHS,
    )
    const createResult = await fetchOrdsJsonCandidates(createPaths, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const inventoryMap = await getInventoryMap()
    const fromResponse = extractOrdsItems(createResult.data)
      .map((row) => toInventoryMovement(row, inventoryMap))
      .find((movement) => movement.itemId === itemId)

    if (fromResponse) {
      return Response.json(
        {
          ...fromResponse,
          userId,
          userName,
          userEmail: String(userProfile?.correo ?? session?.user?.email ?? '').trim() || null,
          userFirstName: String(userProfile?.nombre ?? session?.user?.name ?? '').trim() || null,
          userLastName: String(userProfile?.apellidos ?? '').trim() || null,
          userRole,
        },
        { status: 201 },
      )
    }

    const resolved = await tryResolveCreatedMovement(itemId, movementType, quantity, date)
    if (resolved) {
      return Response.json(
        {
          ...resolved,
          userId,
          userName,
          userEmail: String(userProfile?.correo ?? session?.user?.email ?? '').trim() || null,
          userFirstName: String(userProfile?.nombre ?? session?.user?.name ?? '').trim() || null,
          userLastName: String(userProfile?.apellidos ?? '').trim() || null,
          userRole,
        },
        { status: 201 },
      )
    }

    throw new Error('Movimiento creado, pero no se pudo confirmar en el historial actual.')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo registrar el movimiento real.'

    return Response.json({ error: message }, { status: 500 })
  }
}
