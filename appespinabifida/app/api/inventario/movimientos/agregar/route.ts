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
  reciboId?: number | null
  date?: string
  movementType?: 'in' | 'out'
  quantity?: number
  notes?: string
  esComodato?: boolean
  comodatoAQuien?: string
  comodatoTiempo?: string
  comodatoCondiciones?: string
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

type ValidatedMovement = {
  itemId: number
  quantity: number
  movementType: 'in' | 'out'
  reciboId: number | null
  date: string
  notes: string
  esComodatoFlag: 0 | 1
  comodatoAQuien: string
  comodatoTiempo: string
  comodatoCondiciones: string
}

function validateMovementBody(
  body: CreateMovementBody,
): ValidatedMovement | Response {
  const itemId = asPositiveInteger(body.itemId)

  if (!itemId) {
    return Response.json(
      { error: 'itemId es obligatorio para crear el movimiento.' },
      { status: 400 },
    )
  }

  const quantity = asPositiveInteger(body.quantity)

  if (!quantity) {
    return Response.json(
      { error: 'quantity debe ser un numero entero mayor a 0.' },
      { status: 400 },
    )
  }

  const movementType = body.movementType

  if (movementType !== 'in' && movementType !== 'out') {
    return Response.json(
      { error: 'movementType debe ser in o out.' },
      { status: 400 },
    )
  }

  const reciboId = asPositiveInteger(
    (body as Record<string, unknown>).reciboId ??
      (body as Record<string, unknown>).idRecibo ??
      (body as Record<string, unknown>).id_recibo,
  )

  const comodatoAQuien =
    typeof body.comodatoAQuien === 'string'
      ? body.comodatoAQuien.trim()
      : ''

  const comodatoTiempo =
    typeof body.comodatoTiempo === 'string'
      ? body.comodatoTiempo.trim()
      : ''

  const comodatoCondiciones =
    typeof body.comodatoCondiciones === 'string'
      ? body.comodatoCondiciones.trim()
      : ''

  const esComodatoFlag =
    movementType === 'out' && Boolean(body.esComodato)
      ? 1
      : 0

  if (
    esComodatoFlag &&
    (!comodatoAQuien ||
      !comodatoTiempo ||
      !comodatoCondiciones)
  ) {
    return Response.json(
      {
        error:
          'Para salida en comodato debes completar: a quien se lo prestaste, cuanto tiempo y condiciones acordadas.',
      },
      { status: 400 },
    )
  }

  return {
    itemId,
    quantity,
    movementType,
    reciboId,
    date: toApiDate(body.date),
    notes:
      typeof body.notes === 'string'
        ? body.notes.trim()
        : '',
    esComodatoFlag,
    comodatoAQuien,
    comodatoTiempo,
    comodatoCondiciones,
  }
}

function buildMovementPayload(
  movement: ValidatedMovement,
  userId: number,
) {
  return {
    id_articulo: movement.itemId,
    id_usuario: userId,
    id_recibo: movement.reciboId ?? null,
    fecha: `${movement.date}T00:00:00`,
    tipo: toMovementDbType(movement.movementType),
    cantidad: movement.quantity,
    notas: movement.notes || null,
    es_comodato: movement.esComodatoFlag,
    comodato_a_quien: movement.esComodatoFlag
      ? movement.comodatoAQuien
      : null,
    comodato_tiempo: movement.esComodatoFlag
      ? movement.comodatoTiempo
      : null,
    comodato_condiciones: movement.esComodatoFlag
      ? movement.comodatoCondiciones
      : null,
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    const userId = asPositiveInteger(
      (session?.user as { id?: string } | undefined)?.id,
    )

    const userRole = (
      session?.user as { role?: string } | undefined
    )?.role

    const userName =
      (session?.user as { name?: string; email?: string } | undefined)?.name ??
      (session?.user as { email?: string } | undefined)?.email ??
      'Usuario'

    const userProfile = userId
      ? await getUserById(userId).catch(() => null)
      : null

    if (!userId || !userRole) {
      return Response.json(
        {
          error:
            'No hay sesion valida con usuario y rol para registrar el movimiento.',
        },
        { status: 401 },
      )
    }

    const body = (await request.json()) as CreateMovementBody

    const movement = validateMovementBody(body)

    if (movement instanceof Response) {
      return movement
    }

    const payload = buildMovementPayload(
      movement,
      userId,
    )

    const createPaths = getCandidatePaths(
      'ORDS_MOVEMENTS_CREATE_PATHS',
      DEFAULT_MOVEMENTS_CREATE_PATHS,
    )

    const createResult = await fetchOrdsJsonCandidates(
      createPaths,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    )

    const inventoryMap = await getInventoryMap()

    const fromResponse = extractOrdsItems(
      createResult.data,
    )
      .map((row) =>
        toInventoryMovement(row, inventoryMap),
      )
      .find(
        (responseMovement) =>
          responseMovement.itemId === movement.itemId,
      )

    if (fromResponse) {
      return Response.json(
        {
          ...fromResponse,
          userId,
          userName,
          userEmail:
            String(
              userProfile?.correo ??
                session?.user?.email ??
                '',
            ).trim() || null,
          userFirstName:
            String(
              userProfile?.nombre ??
                session?.user?.name ??
                '',
            ).trim() || null,
          userLastName:
            String(
              userProfile?.apellidos ?? '',
            ).trim() || null,
          userRole,
        },
        { status: 201 },
      )
    }

    const resolved =
      await tryResolveCreatedMovement(
        movement.itemId,
        movement.movementType,
        movement.quantity,
        movement.date,
      )

    if (resolved) {
      return Response.json(
        {
          ...resolved,
          userId,
          userName,
          userEmail:
            String(
              userProfile?.correo ??
                session?.user?.email ??
                '',
            ).trim() || null,
          userFirstName:
            String(
              userProfile?.nombre ??
                session?.user?.name ??
                '',
            ).trim() || null,
          userLastName:
            String(
              userProfile?.apellidos ?? '',
            ).trim() || null,
          userRole,
        },
        { status: 201 },
      )
    }

    throw new Error(
      'Movimiento creado, pero no se pudo confirmar en el historial actual.',
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo registrar el movimiento real.'

    return Response.json(
      { error: message },
      { status: 500 },
    )
  }
}
