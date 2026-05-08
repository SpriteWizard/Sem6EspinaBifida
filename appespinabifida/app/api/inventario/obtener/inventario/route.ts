import {
    extractOrdsItems,
    fetchOrdsJsonCandidates,
    getCandidatePaths,
    normalizeText,
    toInventoryItem,
} from '@/lib/server/inventory-ords'
import type { InventoryItem } from '@/lib/types/inventory'

const DEFAULT_LIST_PATHS = ['inventario/obtenerInventario']

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        const id = parsePositiveInteger(searchParams.get('id'), 0, Number.MAX_SAFE_INTEGER)
        const search = searchParams.get('search') ?? ''
        const categoryId = searchParams.get('categoryId') ?? 'all'
        const cursor = parseCursor(searchParams.get('cursor'))
        const limit = parsePositiveInteger(searchParams.get('limit'), 50)

        const paths = getCandidatePaths('ORDS_INVENTORY_LIST_PATHS', DEFAULT_LIST_PATHS)
        const { data } = await fetchOrdsJsonCandidates(paths, {
            method: 'GET',
        })

        let items = extractOrdsItems(data).map((row) => toInventoryItem(row))

        if (id > 0) {
            items = items.filter((item) => item.id === id)
        }

        const normalizedSearch = normalizeText(search)
        const normalizedCategory = normalizeText(categoryId)

        const filtered = items.filter((item) => {
            const matchesSearch =
                !normalizedSearch ||
                normalizeText(item.name).includes(normalizedSearch) ||
                normalizeText(item.description).includes(normalizedSearch)

            const matchesCategory =
                !normalizedCategory ||
                normalizedCategory === 'all' ||
                normalizeText(item.categoryId) === normalizedCategory

            return matchesSearch && matchesCategory
        })

        const page = filtered.slice(cursor, cursor + limit)
        const nextCursor = cursor + limit < filtered.length ? String(cursor + limit) : null

        return Response.json({
            items: page,
            nextCursor,
        })
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'No se pudo obtener inventario real.'

        return Response.json(
            {
                items: [] as InventoryItem[],
                nextCursor: null,
                error: message,
            },
            { status: 500 },
        )
    }
}