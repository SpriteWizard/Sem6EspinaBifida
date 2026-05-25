import { runSQL, ETAPA_CASE, ETAPA_ORDER, ETAPA_LABEL, parseDateParam, buildDateFilter } from '@/lib/server/ords-sql'
import type { PorResidenciaData } from '@/lib/types/metricas'

const NL_EXPR = `REGEXP_LIKE(UPPER(TRANSLATE(d.ESTADO, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnn')), '^(NL|NUEVO.?LE.N)$')`

type Row = { etapa: string; nl: number; otros: number; total: number }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateFilter = buildDateFilter(
    parseDateParam(searchParams.get('startDate')),
    parseDateParam(searchParams.get('endDate')),
  )

  const SQL = `
WITH addr AS (
  SELECT ad.ID_ASOCIADO,
    CASE WHEN ${NL_EXPR} THEN 1 ELSE 0 END AS es_nl
  FROM ASOCIADO_DIRECCION ad
  JOIN DIRECCION d ON d.ID_DIRECCION = ad.ID_DIRECCION
  WHERE ad.TIPO = 'principal'
),
base AS (
  SELECT a.ID_ASOCIADO,
    ${ETAPA_CASE} AS etapa
  FROM ASOCIADO a
  LEFT JOIN HISTORIAL_MEDICO hm ON hm.ID_ASOCIADO = a.ID_ASOCIADO
  WHERE a.ESTATUS = 'confirmado'
    ${dateFilter}
)
SELECT b.etapa AS etapa,
  SUM(NVL(addr.es_nl, 0))     AS nl,
  SUM(1 - NVL(addr.es_nl, 0)) AS otros,
  COUNT(*)                     AS total
FROM base b
LEFT JOIN addr ON addr.ID_ASOCIADO = b.ID_ASOCIADO
GROUP BY b.etapa
ORDER BY ${ETAPA_ORDER}`

  try {
    const rows = await runSQL<Row>(SQL)
    const filas = rows.map((r) => ({
      etapa: (ETAPA_LABEL[r.etapa] ?? r.etapa) as PorResidenciaData['filas'][0]['etapa'],
      nl: Number(r.nl),
      otros: Number(r.otros),
      total: Number(r.total),
    }))
    const totales = filas.reduce(
      (acc, f) => ({ nl: acc.nl + f.nl, otros: acc.otros + f.otros, total: acc.total + f.total }),
      { nl: 0, otros: 0, total: 0 },
    )
    return Response.json({ filas, totales } satisfies PorResidenciaData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener métricas por residencia'
    return Response.json({ error: message }, { status: 500 })
  }
}
