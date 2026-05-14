import { getMovementUserProfileByMovementId, listMovementUserProfiles } from '@/lib/server/movement-users-ords'

function parseMovementId(value: string | null) {
  if (value === null || value.trim() === '') return null
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return Math.floor(parsed)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const movementId = parseMovementId(searchParams.get('movementId'))

    if (movementId) {
      const item = await getMovementUserProfileByMovementId(movementId)
      return Response.json({ item })
    }

    const items = await listMovementUserProfiles()
    return Response.json({ items })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo obtener el usuario del movimiento.'

    return Response.json({ items: [], error: message }, { status: 500 })
  }
}