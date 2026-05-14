export type MovementType = 'in' | 'out'

export type MovementItemType = 'Material Médico' | 'Equipo Médico' | 'Medicamento' | 'Consumible'

export type InventoryMovement = {
  id: number
  itemId: number | null
  itemName: string
  itemType: MovementItemType
  date: string // YYYY-MM-DD
  movementType: MovementType
  quantity: number
  notes: string
  userId?: number | null
  userName?: string | null
  userEmail?: string | null
  userFirstName?: string | null
  userLastName?: string | null
  userRole?: string | null
}

export type ListMovementsParams = {
  search?: string
  movementType?: MovementType | 'all'
  itemType?: MovementItemType | 'all'
  itemId?: number
  itemName?: string
  date?: string // YYYY-MM-DD
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  cursor?: string | null
  limit?: number
}

export type ListMovementsResult = {
  items: InventoryMovement[]
  nextCursor: string | null
}

export type CreateMovementInput = {
  itemId?: number
  itemName: string
  itemType: MovementItemType
  newItemDescription?: string
  newItemUnidad?: string
  newItemProveedor?: string
  newItemStockMinimo?: number
  newItemCuotaRecuperacion?: number | null
  date: string // YYYY-MM-DD
  movementType: MovementType
  quantity: number
  notes: string
  allowSimilarCreate?: boolean
}

