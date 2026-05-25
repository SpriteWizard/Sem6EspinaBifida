import { runSQL, ETAPA_CASE, ETAPA_ORDER, ETAPA_LABEL, parseDateParam, buildDateFilter } from '@/lib/server/ords-sql'
import type { PorEtapaSexoData } from '@/lib/types/metricas'

const VALID_CURP = `'^[A-Z]{4}[0-9]{6}[HM][A-Z]{2}[A-Z]{4}[A-Z0-9]$'`
const NL_CURP   = `'^[A-Z]{4}[0-9]{6}[HM]NL[A-Z]{4}[A-Z0-9]$'`

type Row = { etapa: string; total: number; mujer: number; hombre: number }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateFilter = buildDateFilter(
    parseDateParam(searchParams.get('startDate')),
    parseDateParam(searchParams.get('endDate')),
  )

  const SQL = `
WITH base AS (
  SELECT
    ${ETAPA_CASE} AS etapa,
    hm.SEXO
  FROM ASOCIADO a
  LEFT JOIN HISTORIAL_MEDICO hm ON hm.ID_ASOCIADO = a.ID_ASOCIADO
  WHERE a.ESTATUS = 'confirmado'
    AND REGEXP_LIKE(a.CURP, ${VALID_CURP})
    AND NOT REGEXP_LIKE(a.CURP, ${NL_CURP})
    ${dateFilter}
)
SELECT etapa,
  COUNT(*)                                          AS total,
  SUM(CASE WHEN SEXO = 'Femenino'  THEN 1 ELSE 0 END) AS mujer,
  SUM(CASE WHEN SEXO = 'Masculino' THEN 1 ELSE 0 END) AS hombre
FROM base
GROUP BY etapa
ORDER BY ${ETAPA_ORDER}`

  try {
    const rows = await runSQL<Row>(SQL)
    const filas = rows.map((r) => ({
      etapa: (ETAPA_LABEL[r.etapa] ?? r.etapa) as PorEtapaSexoData['filas'][0]['etapa'],
      total: Number(r.total),
      mujer: Number(r.mujer),
      hombre: Number(r.hombre),
    }))
    const totales = filas.reduce(
      (acc, f) => ({
        total: acc.total + f.total,
        mujer: acc.mujer + f.mujer,
        hombre: acc.hombre + f.hombre,
      }),
      { total: 0, mujer: 0, hombre: 0 },
    )
    return Response.json({ filas, totales } satisfies PorEtapaSexoData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener métricas CURP foráneos'
    return Response.json({ error: message }, { status: 500 })
  }
}
