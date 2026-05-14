'use client'

import { Badge } from '../ui/Badge'
import type { InventoryItem } from '../../lib/types/inventory'

export function InventoryTable({
  items,
  loading,
  error,
  onItemClick,
}: {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  onItemClick?: (item: InventoryItem) => void
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[1000px] w-full border-collapse">
        <thead>
          <tr className="bg-slate-600 text-white">
            <th className="rounded-tl-2xl px-4 py-4 text-left text-sm font-semibold">
              ID
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Artículo</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Categoría</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Descripción
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold">Cantidad</th>
            <th className="px-4 py-4 text-left text-sm font-semibold">
              Cuota recuperación
            </th>
            <th className="rounded-tr-2xl px-4 py-4 text-left text-sm font-semibold">
              Disponibilidad
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                Cargando…
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td className="px-4 py-6 text-sm text-rose-700" colSpan={7}>
                {error}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                Sin resultados.
              </td>
            </tr>
          ) : (
            items.map((it) => (
              <tr
                key={it.id}
                className={onItemClick ? 'cursor-pointer transition hover:bg-slate-50' : undefined}
                onClick={onItemClick ? () => onItemClick(it) : undefined}
              >
                <td className="px-4 py-5 text-sm text-slate-700">{it.id}</td>
                <td className="px-4 py-5 text-sm font-medium text-slate-800">
                  {it.name}
                </td>
                <td className="px-4 py-5 text-sm text-slate-700">
                  {it.categoryName}
                </td>
                <td
                  className="max-w-[280px] px-4 py-5 text-sm text-slate-600"
                  title={it.description}
                >
                  <span className="block truncate">{it.description}</span>
                </td>
                <td className="px-4 py-5 text-sm text-slate-700">{it.quantity}</td>
                <td className="px-4 py-5 text-sm text-slate-700">
                  {it.cuotaRecuperacion === null
                    ? 'Sin definir'
                    : `$${it.cuotaRecuperacion.toFixed(2)}`}
                </td>
                <td className="px-4 py-5 text-sm">
                    <Badge
                      variant={
                        it.status === 'in_stock'
                          ? 'success'
                          : it.status === 'low_stock'
                            ? 'failed'
                            : 'warning'
                      }
                    >
                      {it.status === 'in_stock'
                        ? 'En stock'
                        : it.status === 'low_stock'
                          ? 'Bajo'
                          : 'Agotado'}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
