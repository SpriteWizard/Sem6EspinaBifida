import {
  extractOrdsItems,
  fetchOrdsJsonCandidates,
  getCandidatePaths,
} from '@/lib/server/inventory-ords'

export type MovementUserProfile = {
  movementId: number | null
  userId: number | null
  userEmail: string | null
  userFirstName: string | null
  userLastName: string | null
  userFullName: string | null
}

const DEFAULT_MOVEMENT_USER_VIEW_PATHS = [
  'inventario/obtenerMovimientosUsuario',
  'VW_MOVIMIENTOS_USUARIO',
  'vw_movimientos_usuario',
  'inventario/VW_MOVIMIENTOS_USUARIO',
  'inventario/vw_movimientos_usuario',
]

function toText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null
  return Math.floor(parsed)
}

function pickText(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = toText(row[key])
    if (value) return value
  }
  return ''
}

function mapRow(row: Record<string, unknown>): MovementUserProfile {
  const movementId = toNullableNumber(
    row.id_movimiento ?? row.idMovimiento ?? row.ID_MOVIMIENTO ?? row.movement_id,
  )
  const userId = toNullableNumber(
    row.id_usuario ?? row.idUsuario ?? row.ID_USUARIO ?? row.user_id,
  )

  const userEmail = pickText(row, [
    'correo',
    'email',
    'correo_usuario',
    'user_email',
    'EMAIL',
  ])

  const userFirstName = pickText(row, [
    'nombre',
    'nombres',
    'first_name',
    'usuario_nombre',
    'NOMBRE',
  ])

  const userLastName = pickText(row, [
    'apellidos',
    'apellido',
    'last_name',
    'usuario_apellidos',
    'APELLIDOS',
  ])

  const userFullName =
    pickText(row, [
      'nombre_completo',
      'full_name',
      'nombreCompleto',
      'usuario_nombre_completo',
    ]) || [userFirstName, userLastName].filter(Boolean).join(' ').trim()

  return {
    movementId,
    userId,
    userEmail: userEmail || null,
    userFirstName: userFirstName || null,
    userLastName: userLastName || null,
    userFullName: userFullName || null,
  }
}

export async function listMovementUserProfiles(): Promise<MovementUserProfile[]> {
  const viewPaths = getCandidatePaths(
    'ORDS_MOVEMENT_USER_VIEW_PATHS',
    DEFAULT_MOVEMENT_USER_VIEW_PATHS,
  )

  const { data } = await fetchOrdsJsonCandidates(viewPaths, {
    method: 'GET',
  })

  return extractOrdsItems(data).map((row) => mapRow(row))
}

export async function getMovementUserProfileByMovementId(
  movementId: number,
): Promise<MovementUserProfile | null> {
  const profiles = await listMovementUserProfiles()
  return profiles.find((profile) => profile.movementId === movementId) ?? null
}