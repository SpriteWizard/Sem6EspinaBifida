import { runSQL, ETAPA_CASE, ETAPA_ORDER, ETAPA_LABEL, parseDateParam, buildDateFilter } from '@/lib/server/ords-sql'
import type { PorNacimientoData } from '@/lib/types/metricas'

const VALID_CURP = `'^[A-Z]{4}[0-9]{6}[HM][A-Z]{2}[A-Z]{4}[A-Z0-9]$'`

type Row = { etapa: string; mexicanos: number; extranjeros: number; total: number }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateFilter = buildDateFilter(
    parseDateParam(searchParams.get('startDate')),
    parseDateParam(searchParams.get('endDate')),
  )

  const SQL = `
WITH base AS (
  SELECT a.ID_ASOCIADO, a.CURP,
    ${ETAPA_CASE} AS etapa
  FROM ASOCIADO a
  LEFT JOIN HISTORIAL_MEDICO hm ON hm.ID_ASOCIADO = a.ID_ASOCIADO
  WHERE a.ESTATUS = 'confirmado'
    ${dateFilter}
)
SELECT etapa,
  SUM(CASE WHEN REGEXP_LIKE(CURP, ${VALID_CURP}) THEN 1 ELSE 0 END) AS mexicanos,
  SUM(CASE WHEN NOT REGEXP_LIKE(CURP, ${VALID_CURP}) OR CURP IS NULL THEN 1 ELSE 0 END) AS extranjeros,
  COUNT(*) AS total
FROM base
GROUP BY etapa
ORDER BY ${ETAPA_ORDER}`

  try {
    const rows = await runSQL<Row>(SQL)
    const filas = rows.map((r) => ({
      etapa: (ETAPA_LABEL[r.etapa] ?? r.etapa) as PorNacimientoData['filas'][0]['etapa'],
      mexicanos: Number(r.mexicanos),
      extranjeros: Number(r.extranjeros),
      total: Number(r.total),
    }))
    const totales = filas.reduce(
      (acc, f) => ({
        mexicanos: acc.mexicanos + f.mexicanos,
        extranjeros: acc.extranjeros + f.extranjeros,
        total: acc.total + f.total,
      }),
      { mexicanos: 0, extranjeros: 0, total: 0 },
    )
    return Response.json({ filas, totales } satisfies PorNacimientoData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener métricas por nacimiento'
    return Response.json({ error: message }, { status: 500 })
  }
}
