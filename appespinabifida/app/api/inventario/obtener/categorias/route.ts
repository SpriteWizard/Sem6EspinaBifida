import {
  extractOrdsItems,
  fetchOrdsJsonCandidates,
  getCandidatePaths,
  normalizeText,
  toInventoryItem,
} from '@/lib/server/inventory-ords'
import type { Category } from '@/lib/types/inventory'

const DEFAULT_LIST_PATHS = ['inventario/obtenerInventario']

export async function GET() {
  try {
    const paths = getCandidatePaths('ORDS_INVENTORY_LIST_PATHS', DEFAULT_LIST_PATHS)
    const { data } = await fetchOrdsJsonCandidates(paths, {
      method: 'GET',
    })

    const inventoryItems = extractOrdsItems(data).map((row) => toInventoryItem(row))

    const unique = new Map<string, string>()
    for (const item of inventoryItems) {
      const normalizedCategoryId = normalizeText(item.categoryId)
      if (!normalizedCategoryId) continue
      if (!unique.has(normalizedCategoryId)) {
        unique.set(normalizedCategoryId, item.categoryName)
      }
    }

    const categories: Category[] = [
      { id: 'all', name: 'Todas las categorias' },
      ...Array.from(unique.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => ({ id, name })),
    ]

    return Response.json(categories)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudieron obtener categorias.'

    return Response.json(
      {
        error: message,
      },
      { status: 500 },
    )
  }
}
