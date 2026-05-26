import { serialize } from "v8";
import * as obtenerConsultas from "./consultas/route";
import * as obtenerEstudios from "./estudios/route";

function parsePositiveInt(value: string | null, fallback: number) {
    const parsed = Number(value ?? "");
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.floor(parsed);
}

type estudio_data = {
    tipo_servicio: "estudio",
    id_estudio: number,
    id_asociado: number,
    id_medico: number,
    id_tipo_estudio: number,
    laboratorio: string,
    aportacion: number,
    ya_aporto: 1 | 0,
    fecha_cita: string,
    estatus: string,
    resultados: string
}

type consulta_data = {
    tipo_servicio: "consulta",
    id_consulta: number,
    id_asociado: number,
    id_medico: number,
    id_estudio: number,
    id_recibo: number,
    tipo_consulta: "primera" | "seguimiento",
    motivo: string,
    diagnostico: string,
    tratamiento: string,
    aportacion: number,
    ya_aporto: 1 | 0,
    estatus: string
}

export async function GET(request: Request){
    const { searchParams } = new URL(request.url);
    const cursor = parsePositiveInt(searchParams.get("cursor"), 0);
    const limit = parsePositiveInt(searchParams.get("limit"), 5);
    const folioFilter = (searchParams.get("folio") ?? "").trim().toLowerCase();
    const tipoFilter = (searchParams.get("tipo") ?? "Todos").trim();
    const asociadoFilter = (searchParams.get("asociado") ?? "").trim().toLowerCase();
    const medicoFilter = (searchParams.get("medico") ?? "Todos").trim();
    const laboratorioFilter = (searchParams.get("laboratorio") ?? "Todos").trim();
    const fechaFilter = (searchParams.get("fecha") ?? "").trim();
    const estatusFilter = (searchParams.get("estatus") ?? "Todos").trim();

    const res = await obtenerConsultas.GET();
    const res2 = await obtenerEstudios.GET();

    const result = await res.json();
    const result2 = await res2.json();
    const listaConsultas: consulta_data[] = result;
    const listaEstudios: estudio_data[] = result2;
    const servicios: (consulta_data | estudio_data)[] = [...listaConsultas, ...listaEstudios];

    const enriched = servicios.map((item: any) => {
        const tipo = item.tipo_servicio;
        const folio = tipo === "Consulta"
            ? `CON-${item.id_consulta}`
            : `EST-${item.id_estudio}`;
        const asociadoNombre = `${item.nombre_asociado ?? ""} ${item.apellidos_asociado ?? ""}`.trim();
        const asociadoId = String(item.asociado ?? "");
        const fechaCreacionConsulta =
            item.fecha_creacion ?? item.fechaCreacion ?? item.fechacreacion ?? item.FECHA_CREACION;
        const fechaCreacionEstudio =
            item.fecha ?? item.FECHA ?? item.fecha_creacion ?? item.fechaCreacion ?? item.fechacreacion;
        const rawFecha = tipo === "Consulta" ? fechaCreacionConsulta : fechaCreacionEstudio;
        const fechaOrden = Date.parse(String(rawFecha ?? ""));
        const fecha = String(rawFecha ?? "").split("T")[0];

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
                fechaOrden: Number.isNaN(fechaOrden) ? 0 : fechaOrden,
                estatus: item.estatus ?? "",
            },
        };
    });

    const filtrados = enriched.filter(({ meta }) => {
        if (folioFilter && !meta.folio.toLowerCase().includes(folioFilter)) return false;
        if (tipoFilter !== "Todos" && meta.tipo !== tipoFilter) return false;
        if (
            asociadoFilter &&
            !meta.asociadoNombre.toLowerCase().includes(asociadoFilter) &&
            !meta.asociadoId.toLowerCase().includes(asociadoFilter)
        ) return false;
        if (medicoFilter !== "Todos" && meta.medico !== medicoFilter) return false;
        if (laboratorioFilter !== "Todos" && meta.laboratorio !== laboratorioFilter) return false;
        if (fechaFilter && meta.fecha !== fechaFilter) return false;
        if (estatusFilter !== "Todos" && meta.estatus !== estatusFilter) return false;
        return true;
    });

    filtrados.sort((a, b) => b.meta.fechaOrden - a.meta.fechaOrden);

    const paged = filtrados.slice(cursor, cursor + limit).map((entry) => entry.item);
    const nextCursor = cursor + limit < filtrados.length ? String(cursor + limit) : null;

    return Response.json({ items: paged, nextCursor });
}