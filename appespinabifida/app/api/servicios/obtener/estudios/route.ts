import { getLocalTimestamp, normalizeDateString } from "@/lib/servicios-utils"

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value ?? "")
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.floor(parsed)
}

function normalize(value: string | null) {
  return String(value ?? "").trim().toLowerCase()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = parsePositiveInt(searchParams.get("cursor"), 0)
  const limit = parsePositiveInt(searchParams.get("limit"), 5)
  const folioFilter = normalize(searchParams.get("folio"))
  const tipoFilter = (searchParams.get("tipo") ?? "Todos").trim()
  const asociadoFilter = normalize(searchParams.get("asociado"))
  const medicoFilter = (searchParams.get("medico") ?? "Todos").trim()
  const laboratorioFilter = (searchParams.get("laboratorio") ?? "Todos").trim()
  const fechaFilter = (searchParams.get("fecha") ?? "").trim()
  const estatusFilter = (searchParams.get("estatus") ?? "Todos").trim()

  const res = await fetch(
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/obtenerEstudios`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
      },
    },
  )

  const payload = await res.json()
  const items = Array.isArray(payload?.items) ? payload.items : []
  const estudios = items.map((item: any) => ({
    ...item,
    tipo_servicio: "Estudio",
  }))

  const enriched = estudios.map((item: any) => {
    const tipo = item.tipo_servicio
    const folio = tipo === "Consulta" ? `CON-${item.id_consulta}` : `EST-${item.id_estudio}`
    const asociadoNombre = `${item.nombre_asociado ?? ""} ${item.apellidos_asociado ?? ""}`.trim()
    const asociadoId = String(item.asociado ?? "")
    const fechaCreacionConsulta =
      item.fecha_creacion ?? item.fechaCreacion ?? item.fechacreacion ?? item.FECHA_CREACION
    const fechaCreacionEstudio =
      item.FECHA ?? item.fecha ?? item.fecha_cita ?? item.fecha_creacion ?? item.fechaCreacion ?? item.fechacreacion
    const rawFecha = tipo === "Consulta" ? fechaCreacionConsulta : fechaCreacionEstudio
    const fechaOrden = getLocalTimestamp(rawFecha)
    const fecha = normalizeDateString(rawFecha)

    return {
      item,
      meta: {
        tipo,
        folio,
        asociadoNombre,
        asociadoId,
        medico: item.medico ?? "",
        laboratorio: item.laboratorio ?? "",
        fecha,
        fecha_creacion: normalizeDateString(item.fecha_creacion ?? ""),
        fechaOrden: Number.isNaN(fechaOrden) ? 0 : fechaOrden,
        estatus: item.estatus ?? "",
      },
    }
  })

  const filtrados = enriched.filter(({ meta }) => {
    if (folioFilter && !meta.folio.toLowerCase().includes(folioFilter)) return false
    if (tipoFilter !== "Todos" && meta.tipo !== tipoFilter) return false
    if (
      asociadoFilter &&
      !meta.asociadoNombre.toLowerCase().includes(asociadoFilter) &&
      !meta.asociadoId.toLowerCase().includes(asociadoFilter)
    )
      return false
    if (medicoFilter !== "Todos" && meta.medico !== medicoFilter) return false
    if (laboratorioFilter !== "Todos" && meta.laboratorio !== laboratorioFilter) return false
    if (fechaFilter && meta.fecha !== fechaFilter) return false
    if (estatusFilter !== "Todos" && meta.estatus !== estatusFilter) return false
    return true
  })

  filtrados.sort((a, b) => b.meta.fechaOrden - a.meta.fechaOrden)

  const paged = filtrados.slice(cursor, cursor + limit).map((entry) => entry.item)
  const nextCursor = cursor + limit < filtrados.length ? String(cursor + limit) : null

  return Response.json({ items: paged, nextCursor })
}
