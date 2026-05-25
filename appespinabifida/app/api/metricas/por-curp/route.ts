import { runSQL, ETAPA_CASE, ETAPA_ORDER, ETAPA_LABEL, parseDateParam, buildDateFilter } from '@/lib/server/ords-sql'
import type { PorCurpData } from '@/lib/types/metricas'

type Row = { etapa: string; curp_nl: number; curp_foraneo: number; total: number }

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
  SUM(CASE WHEN REGEXP_LIKE(CURP, '^[A-Z]{4}[0-9]{6}[HM]NL[A-Z]{4}[A-Z0-9]$')
           THEN 1 ELSE 0 END) AS curp_nl,
  SUM(CASE WHEN REGEXP_LIKE(CURP, '^[A-Z]{4}[0-9]{6}[HM][A-Z]{2}[A-Z]{4}[A-Z0-9]$')
            AND NOT REGEXP_LIKE(CURP, '^[A-Z]{4}[0-9]{6}[HM]NL[A-Z]{4}[A-Z0-9]$')
           THEN 1 ELSE 0 END) AS curp_foraneo,
  COUNT(*) AS total
FROM base
GROUP BY etapa
ORDER BY ${ETAPA_ORDER}`

  try {
    const rows = await runSQL<Row>(SQL)
    const filas = rows.map((r) => ({
      etapa: (ETAPA_LABEL[r.etapa] ?? r.etapa) as PorCurpData['filas'][0]['etapa'],
      curp_nl: Number(r.curp_nl),
      curp_foraneo: Number(r.curp_foraneo),
      total: Number(r.total),
    }))
    const totales = filas.reduce(
      (acc, f) => ({
        curp_nl: acc.curp_nl + f.curp_nl,
        curp_foraneo: acc.curp_foraneo + f.curp_foraneo,
        total: acc.total + f.total,
      }),
      { curp_nl: 0, curp_foraneo: 0, total: 0 },
    )
    return Response.json({ filas, totales } satisfies PorCurpData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener métricas por CURP'
    return Response.json({ error: message }, { status: 500 })
  }
}
