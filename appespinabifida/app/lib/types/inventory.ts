export type InventoryStatus = 'in_stock' | 'out_of_stock' | 'low_stock'

export type InventoryItem = {
  id: number
  clave: string | null
  name: string
  categoryId: string
  categoryName: string
  description: string
  unidad: string | null
  proveedor: string | null
  stockMinimo: number
  cuotaRecuperacion: number | null
  quantity: number
  status: InventoryStatus
}

export type Category = {
  id: string
  name: string
}

export type ListInventoryParams = {
  search?: string
  categoryId?: string
  cursor?: string | null
  limit?: number
}

export type ListInventoryResult = {
  items: InventoryItem[]
  nextCursor: string | null
}

export type CreateProductInput = {
  clave?: string | null
  name: string
  categoryId: string
  description: string
  unidad?: string | null
  proveedor?: string | null
  stockMinimo?: number
  cuotaRecuperacion?: number | null
  quantity: number
  status?: InventoryStatus
}
