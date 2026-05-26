import { runSQL, parseDateParam } from '@/lib/server/ords-sql'
import type { RegistrosMesData } from '@/lib/types/metricas'

type Row = { mes: string; registros: number }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = parseDateParam(searchParams.get('startDate'))
  const endDate   = parseDateParam(searchParams.get('endDate'))

  const conditions = [`ESTATUS = 'confirmado'`, `FECHA_ALTA IS NOT NULL`]
  if (startDate) conditions.push(`FECHA_ALTA >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
  if (endDate)   conditions.push(`FECHA_ALTA <= TO_DATE('${endDate}', 'YYYY-MM-DD')`)

  const SQL = `
SELECT TO_CHAR(FECHA_ALTA, 'YYYY-MM') AS mes, COUNT(*) AS registros
FROM ASOCIADO
WHERE ${conditions.join('\n  AND ')}
GROUP BY TO_CHAR(FECHA_ALTA, 'YYYY-MM')
ORDER BY mes`

  try {
    const rows = await runSQL<Row>(SQL)
    const countByMonth = new Map(rows.map((r) => [r.mes, Number(r.registros)]))

    // Determine the range to fill with zeros
    const now = new Date()
    const rangeStart = startDate
      ? new Date(startDate + 'T00:00:00')
      : new Date(now.getFullYear(), 0, 1)
    const rangeEnd = endDate
      ? new Date(endDate + 'T00:00:00')
      : now

    const filas: { mes: string; registros: number }[] = []
    const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
    const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1)

    while (cur <= last) {
      const mes = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
      filas.push({ mes, registros: countByMonth.get(mes) ?? 0 })
      cur.setMonth(cur.getMonth() + 1)
    }

    const total = filas.reduce((s, f) => s + f.registros, 0)
    const promedio_anual = filas.length > 0 ? Math.round((total / filas.length) * 10) / 10 : 0
    const anio = rangeStart.getFullYear()

    return Response.json({ anio, filas, promedio_anual } satisfies RegistrosMesData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener registros por mes'
    return Response.json({ error: message }, { status: 500 })
  }
}
