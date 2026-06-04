const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseDateParam(value: string | null): string | null {
  if (!value || !DATE_RE.test(value)) return null
  return value
}

/** Returns a SQL fragment (with leading AND) that filters a.FECHA_ALTA by the given range. */
export function buildDateFilter(startDate: string | null, endDate: string | null): string {
  const parts: string[] = []
  if (startDate) parts.push(`a.FECHA_ALTA >= TO_DATE('${startDate}', 'YYYY-MM-DD')`)
  if (endDate)   parts.push(`a.FECHA_ALTA <= TO_DATE('${endDate}', 'YYYY-MM-DD')`)
  return parts.length ? `AND ${parts.join('\n    AND ')}` : ''
}

const ORDS_BASE = (
  process.env.ORDS_BASE_URL ??
  'https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin'
).replace(/\/+$/, '')

function authHeader() {
  return (
    'Basic ' +
    Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString('base64')
  )
}

export async function runSQL<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const res = await fetch(`${ORDS_BASE}/_/sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({ statementText: sql, offset: 0, limit: 2000 }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`ORDS SQL → ${res.status}`)
  const data = await res.json()
  return (data.items?.[0]?.resultSet?.items ?? []) as T[]
}

export const ETAPA_CASE = `CASE
  WHEN hm.FECHA_NACIMIENTO IS NULL THEN 'Sin clasificar'
  WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 0 AND 5 THEN 'Primera infancia'
  WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 6 AND 11 THEN 'Infancia'
  WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 12 AND 17 THEN 'Adolescencia'
  WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 18 AND 29 THEN 'Jovenes'
  WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 30 AND 59 THEN 'Adultos'
  WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) >= 65 THEN 'Adultos mayores'
  ELSE 'Sin clasificar'
END`

export const ETAPA_ORDER = `CASE etapa
  WHEN 'Primera infancia' THEN 1
  WHEN 'Infancia' THEN 2
  WHEN 'Adolescencia' THEN 3
  WHEN 'Jovenes' THEN 4
  WHEN 'Adultos' THEN 5
  WHEN 'Adultos mayores' THEN 6
  ELSE 7
END`

// SQL → display label mapping ('Jovenes' avoids UTF-8 encoding risk in SQL literals)
export const ETAPA_LABEL: Record<string, string> = {
  'Primera infancia': 'Primera infancia',
  'Infancia': 'Infancia',
  'Adolescencia': 'Adolescencia',
  'Jovenes': 'Jóvenes',
  'Adultos': 'Adultos',
  'Adultos mayores': 'Adultos mayores',
  'Sin clasificar': 'Sin clasificar',
}
