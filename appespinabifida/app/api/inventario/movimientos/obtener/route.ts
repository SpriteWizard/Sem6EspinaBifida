import {
  extractOrdsItems,
  fetchOrdsJsonCandidates,
  getCandidatePaths,
  normalizeText,
  toInventoryItem,
  toInventoryMovement,
} from '@/lib/server/inventory-ords'
import { listMovementUserProfiles } from '@/lib/server/movement-users-ords'
import { getUserById } from '@/lib/db/user'
import type { InventoryMovement } from '@/lib/types/movements'

const DEFAULT_MOVEMENTS_LIST_PATHS = [
  'inventario/obtenerMovimientos',
  'inventario/listarMovimientos',
  'inventario/movimientos',
]
const DEFAULT_INVENTORY_LIST_PATHS = ['inventario/obtenerInventario']

function parsePositiveInteger(value: string | null, fallback: number, max = 500) {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

function parseCursor(value: string | null) {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return Math.floor(parsed)
}

function sortByNewest(a: InventoryMovement, b: InventoryMovement) {
  const byId = b.id - a.id
  if (byId !== 0) return byId
  return b.date.localeCompare(a.date)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') ?? ''
    const movementType = searchParams.get('movementType') ?? 'all'
    const itemType = searchParams.get('itemType') ?? 'all'
    const itemId = parsePositiveInteger(searchParams.get('itemId'), 0, Number.MAX_SAFE_INTEGER)
    const itemName = searchParams.get('itemName') ?? ''
    const date = searchParams.get('date') ?? ''
    const dateFrom = searchParams.get('dateFrom') ?? ''
    const dateTo = searchParams.get('dateTo') ?? ''
    const cursor = parseCursor(searchParams.get('cursor'))
    const limit = parsePositiveInteger(searchParams.get('limit'), 50)

    const inventoryPaths = getCandidatePaths(
      'ORDS_INVENTORY_LIST_PATHS',
      DEFAULT_INVENTORY_LIST_PATHS,
    )
    const movementPaths = getCandidatePaths(
      'ORDS_MOVEMENTS_LIST_PATHS',
      DEFAULT_MOVEMENTS_LIST_PATHS,
    )

    const [{ data: inventoryData }, { data: movementData }] = await Promise.all([
      fetchOrdsJsonCandidates(inventoryPaths, { method: 'GET' }),
      fetchOrdsJsonCandidates(movementPaths, { method: 'GET' }),
    ])

    const inventoryMap = new Map(
      extractOrdsItems(inventoryData)
        .map((row) => toInventoryItem(row))
        .map((item) => [item.id, item] as const),
    )

    const allMovements = extractOrdsItems(movementData)
      .map((row) => toInventoryMovement(row, inventoryMap))
      .sort(sortByNewest)

    const userProfiles = await listMovementUserProfiles().catch(() => [])
    const userProfilesByMovementId = new Map(
      userProfiles
        .filter((profile) => profile.movementId !== null)
        .map((profile) => [profile.movementId as number, profile] as const),
    )

    const userCache = new Map<
      number,
      {
        name?: string
        firstName?: string
        lastName?: string
        email?: string
        role?: string
      } | null
    >()

    async function resolveUserLabel(userId: number | null | undefined) {
      if (userId == null || userId <= 0) return null
      if (userCache.has(userId)) return userCache.get(userId) ?? null
      const user = await getUserById(userId)
      if (!user) {
        userCache.set(userId, null)
        return null
      }

      const resolved = {
        name:
          String(user.nombre ?? user.name ?? user.full_name ?? user.correo ?? '').trim() || undefined,
        firstName: String(user.nombre ?? user.name ?? '').trim() || undefined,
        lastName: String(user.apellidos ?? user.last_name ?? '').trim() || undefined,
        email: String(user.correo ?? user.email ?? '').trim() || undefined,
        role: String(user.role ?? user.rol ?? '').trim() || undefined,
      }
      userCache.set(userId, resolved)
      return resolved
    }

    const enrichedMovements = await Promise.all(
      allMovements.map(async (movement) => {
        const profile = movement.id > 0 ? userProfilesByMovementId.get(movement.id) : null
        if (movement.userName && movement.userRole && profile) {
          return {
            ...movement,
            userEmail: movement.userEmail ?? profile.userEmail ?? null,
            userFirstName: movement.userFirstName ?? profile.userFirstName ?? null,
            userLastName: movement.userLastName ?? profile.userLastName ?? null,
          }
        }

        if (profile) {
          const profileName = [profile.userFirstName, profile.userLastName].filter(Boolean).join(' ').trim()
          return {
            ...movement,
            userId: movement.userId ?? profile.userId,
            userName:
              movement.userName ?? profile.userFullName ?? (profileName || null),
            userEmail: movement.userEmail ?? profile.userEmail ?? null,
            userFirstName: movement.userFirstName ?? profile.userFirstName ?? null,
            userLastName: movement.userLastName ?? profile.userLastName ?? null,
          }
        }

        if (movement.userName && movement.userRole) return movement
        const user = await resolveUserLabel(movement.userId)
        if (!user) return movement
        return {
          ...movement,
          userName:
            movement.userName ?? user.name ?? ([user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null),
          userEmail: movement.userEmail ?? user.email ?? null,
          userFirstName: movement.userFirstName ?? user.firstName ?? null,
          userLastName: movement.userLastName ?? user.lastName ?? null,
          userRole: movement.userRole ?? user.role ?? null,
        }
      }),
    )

    const normalizedSearch = normalizeText(search)
    const normalizedItemType = normalizeText(itemType)
    const normalizedItemName = normalizeText(itemName)
    const normalizedMovementType = normalizeText(movementType)
    const normalizedDate = normalizeText(date)
    const normalizedDateFrom = normalizeText(dateFrom)
    const normalizedDateTo = normalizeText(dateTo)
    const hasDateRange = normalizedDateFrom !== '' || normalizedDateTo !== ''

    const filtered = enrichedMovements.filter((movement) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(movement.itemName).includes(normalizedSearch) ||
        normalizeText(movement.notes).includes(normalizedSearch)

      const matchesMovementType =
        !normalizedMovementType ||
        normalizedMovementType === 'all' ||
        normalizeText(movement.movementType) === normalizedMovementType

      const matchesItemType =
        !normalizedItemType ||
        normalizedItemType === 'all' ||
        normalizeText(movement.itemType) === normalizedItemType

      const matchesItemId = itemId <= 0 || movement.itemId === itemId

      const matchesItemName =
        !normalizedItemName || normalizeText(movement.itemName) === normalizedItemName

      const movementDate = normalizeText(movement.date)
      const matchesDate = normalizedDate
        ? movementDate === normalizedDate
        : !hasDateRange ||
          ((normalizedDateFrom === '' || movementDate >= normalizedDateFrom) &&
            (normalizedDateTo === '' || movementDate <= normalizedDateTo))

      return (
        matchesSearch &&
        matchesMovementType &&
        matchesItemType &&
        matchesItemId &&
        matchesItemName &&
        matchesDate
      )
    })

    const page = filtered.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < filtered.length ? String(cursor + limit) : null

    return Response.json({
      items: page,
      nextCursor,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo obtener el historial real.'

    return Response.json(
      {
        items: [] as InventoryMovement[],
        nextCursor: null,
        error: message,
      },
      { status: 500 },
    )
  }
}
