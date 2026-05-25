import { runSQL, parseDateParam, buildDateFilter } from '@/lib/server/ords-sql'
import type { PorEstadoData } from '@/lib/types/metricas'

type Row = { estado: string; total: number }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateFilter = buildDateFilter(
    parseDateParam(searchParams.get('startDate')),
    parseDateParam(searchParams.get('endDate')),
  )

  const SQL = `
SELECT
  NVL(TRIM(d.ESTADO), 'Sin estado') AS estado,
  COUNT(*)                           AS total
FROM ASOCIADO a
LEFT JOIN ASOCIADO_DIRECCION ad
  ON ad.ID_ASOCIADO = a.ID_ASOCIADO AND ad.TIPO = 'principal'
LEFT JOIN DIRECCION d
  ON d.ID_DIRECCION = ad.ID_DIRECCION
WHERE a.ESTATUS = 'confirmado'
  ${dateFilter}
GROUP BY NVL(TRIM(d.ESTADO), 'Sin estado')
ORDER BY total DESC`

  try {
    const rows = await runSQL<Row>(SQL)
    const filas = rows.map((r) => ({
      estado: String(r.estado),
      total: Number(r.total),
    }))
    const total_nacional = filas.reduce((s, f) => s + f.total, 0)
    return Response.json({ filas, total_nacional } satisfies PorEstadoData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener métricas por estado'
    return Response.json({ error: message }, { status: 500 })
  }
}
