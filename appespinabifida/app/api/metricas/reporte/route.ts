import { runSQL, parseDateParam } from '@/lib/server/ords-sql'
import type { ReporteData } from '@/lib/pdf/reporte'

type SummaryRow = {
  cant_credenciales: number
  cant_servicios: number
  exentos: number
  cuota: number
  urbano: number
  rural: number
}

type DemoRow = {
  hombres: number
  mujeres: number
  lactantes: number
  ninos: number
  adolescentes: number
  adultos: number
}

type ServicioRow = { servicio: string; cant: number; unidad: string }
type CiudadRow   = { ciudad: string;   cant: number }
type EstudioRow  = { estudio: string;  cant: number }

function dateClause(col: string, from: string | null, to: string | null): string {
  const parts: string[] = []
  if (from) parts.push(`${col} >= TO_DATE('${from}', 'YYYY-MM-DD')`)
  if (to)   parts.push(`${col} <= TO_DATE('${to}',   'YYYY-MM-DD')`)
  return parts.length ? `AND ${parts.join(' AND ')}` : ''
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = parseDateParam(searchParams.get('from'))
  const to   = parseDateParam(searchParams.get('to'))

  const reciboDates  = dateClause('r.FECHA',        from, to)
  const credDates    = dateClause('FECHA_EMISION',   from, to)
  const estudioDates = dateClause('TRUNC(e.FECHA)',  from, to)

  try {
    const [summaryRows, demoRows, servicioRows, ciudadRows, estudioRows] = await Promise.all([

      // ── Summary counts ──────────────────────────────────────────────────────
      runSQL<SummaryRow>(`
        SELECT
          (SELECT COUNT(*) FROM CREDENCIAL WHERE 1=1 ${credDates})   AS cant_credenciales,
          (SELECT COUNT(*) FROM RECIBO r   WHERE 1=1 ${reciboDates}) AS cant_servicios,
          (SELECT SUM(CASE WHEN TIPO_CUOTA = 'exento' THEN 1 ELSE 0 END)
           FROM RECIBO r WHERE 1=1 ${reciboDates}) AS exentos,
          (SELECT SUM(CASE WHEN TIPO_CUOTA = 'cuota' THEN 1 ELSE 0 END)
           FROM RECIBO r WHERE 1=1 ${reciboDates}) AS cuota,
          (SELECT SUM(CASE WHEN TIPO_ZONA = 'urbano' THEN 1 ELSE 0 END)
           FROM RECIBO r WHERE 1=1 ${reciboDates}) AS urbano,
          (SELECT SUM(CASE WHEN TIPO_ZONA = 'rural' THEN 1 ELSE 0 END)
           FROM RECIBO r WHERE 1=1 ${reciboDates}) AS rural
        FROM DUAL`),

      // ── Demographics: distinct asociados with a recibo in the period ────────
      runSQL<DemoRow>(`
        SELECT
          COUNT(DISTINCT CASE WHEN hm.SEXO = 'Masculino' THEN r.ID_ASOCIADO END) AS hombres,
          COUNT(DISTINCT CASE WHEN hm.SEXO = 'Femenino'  THEN r.ID_ASOCIADO END) AS mujeres,
          COUNT(DISTINCT CASE
            WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 0  AND 5
            THEN r.ID_ASOCIADO END) AS lactantes,
          COUNT(DISTINCT CASE
            WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 6  AND 11
            THEN r.ID_ASOCIADO END) AS ninos,
          COUNT(DISTINCT CASE
            WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) BETWEEN 12 AND 17
            THEN r.ID_ASOCIADO END) AS adolescentes,
          COUNT(DISTINCT CASE
            WHEN FLOOR(MONTHS_BETWEEN(SYSDATE, hm.FECHA_NACIMIENTO)/12) >= 18
            THEN r.ID_ASOCIADO END) AS adultos
        FROM RECIBO r
        LEFT JOIN HISTORIAL_MEDICO hm ON hm.ID_ASOCIADO = r.ID_ASOCIADO
        WHERE 1=1 ${reciboDates}`),

      // ── Servicios: inventory dispatches linked to recibos in the period ─────
      runSQL<ServicioRow>(`
        SELECT
          UPPER(a.NOMBRE)        AS servicio,
          SUM(mi.CANTIDAD)       AS cant,
          UPPER(a.UNIDAD)        AS unidad
        FROM MOVIMIENTO_INVENTARIO mi
        JOIN ARTICULO a ON a.ID_ARTICULO = mi.ID_ARTICULO
        JOIN RECIBO r   ON r.ID_RECIBO   = mi.ID_RECIBO
        WHERE mi.TIPO = 'salida'
          ${reciboDates}
        GROUP BY UPPER(a.NOMBRE), UPPER(a.UNIDAD)
        ORDER BY cant DESC, servicio`),

      // ── Ciudades: distinct asociados by city for recibos in the period ──────
      runSQL<CiudadRow>(`
        SELECT
          UPPER(TRIM(d.CIUDAD)) AS ciudad,
          COUNT(DISTINCT r.ID_ASOCIADO) AS cant
        FROM RECIBO r
        JOIN ASOCIADO_DIRECCION ad
          ON ad.ID_ASOCIADO = r.ID_ASOCIADO AND ad.TIPO = 'principal'
        JOIN DIRECCION d ON d.ID_DIRECCION = ad.ID_DIRECCION
        WHERE UPPER(TRIM(NVL(d.CIUDAD, ''))) NOT IN ('', 'NULL')
          ${reciboDates}
        GROUP BY UPPER(TRIM(d.CIUDAD))
        ORDER BY cant DESC, ciudad`),

      // ── Estudios: studies in the period grouped by type ─────────────────────
      runSQL<EstudioRow>(`
        SELECT
          UPPER(te.NOMBRE) AS estudio,
          COUNT(*)         AS cant
        FROM ESTUDIO e
        JOIN TIPO_ESTUDIO te ON te.ID_TIPO_ESTUDIO = e.ID_TIPO_ESTUDIO
        WHERE 1=1 ${estudioDates}
        GROUP BY UPPER(te.NOMBRE)
        ORDER BY cant DESC`),
    ])

    const s = summaryRows[0] ?? {}
    const d = demoRows[0]    ?? {}

    const result: ReporteData = {
      cantCredenciales: Number(s.cant_credenciales ?? 0),
      cantServicios:    Number(s.cant_servicios    ?? 0),
      exentos:          Number(s.exentos           ?? 0),
      cuota:            Number(s.cuota             ?? 0),
      urbano:           Number(s.urbano            ?? 0),
      rural:            Number(s.rural             ?? 0),
      hombres:          Number(d.hombres           ?? 0),
      mujeres:          Number(d.mujeres           ?? 0),
      lactantes:        Number(d.lactantes         ?? 0),
      ninos:            Number(d.ninos             ?? 0),
      adolescentes:     Number(d.adolescentes      ?? 0),
      adultos:          Number(d.adultos           ?? 0),
      servicios: servicioRows.map((r) => ({
        cant:     Number(r.cant),
        servicio: String(r.servicio),
        unidad:   String(r.unidad),
      })),
      ciudades: ciudadRows.map((r) => ({
        cant:   Number(r.cant),
        ciudad: String(r.ciudad),
      })),
      estudios: estudioRows.map((r) => ({
        cant:    Number(r.cant),
        estudio: String(r.estudio),
      })),
    }

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar reporte'
    return Response.json({ error: message }, { status: 500 })
  }
}
