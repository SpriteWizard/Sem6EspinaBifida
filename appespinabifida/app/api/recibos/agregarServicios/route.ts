const ORDS_BASE =
    "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin";

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
    };
}

function parseMoneyValue(value: unknown): number {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === "string") {
        const normalized = value.replace(/[^0-9.-]/g, "");
        if (!normalized) return 0;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

function getLocalConsultaRef(value: unknown, fallback: number): string {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return `CON-${fallback}`;
}

function normalizeDateTime(value: unknown): string {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return "";
    return raw.includes(" ") ? raw : `${raw} 00:00:00`;
}

function getValue(row: any, keys: string[]) {
    for (const key of keys) {
        if (row?.[key] != null) return row[key];
    }
    return null;
}

function getNumber(row: any, keys: string[]) {
    const value = getValue(row, keys);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function readResponseBody(res: Response) {
    const text = await res.text().catch(() => "");
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function postOrds(path: string, data: unknown) {
    const res = await fetch(`${ORDS_BASE}${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    const body = await readResponseBody(res);
    return { res, body };
}

async function fetchConsultas() {
    const res = await fetch(`${ORDS_BASE}/services/obtenerConsultas`, {
        method: "GET",
        headers: authHeaders(),
    });
    if (!res.ok) return [];

    const data = await res.json().catch(() => null);
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
}

function getConsultaId(row: any) {
    return getNumber(row, ["id_consulta", "ID_CONSULTA"]);
}

function getConsultaAsociadoId(row: any) {
    return getNumber(row, ["id_asociado", "ID_ASOCIADO", "asociado", "ASOCIADO"]);
}

function getConsultaTipo(row: any) {
    const value = getValue(row, ["tipo_consulta", "TIPO_CONSULTA"]);
    return typeof value === "string" ? value : "";
}

function findCreatedConsultaId(
    consultasDb: any[],
    payload: ReturnType<typeof normalizeConsulta>,
    minId: number,
) {
    const matches = consultasDb
        .filter((item: any) => getConsultaAsociadoId(item) === payload.id_asociado)
        .filter((item: any) => getConsultaTipo(item) === payload.tipo_consulta)
        .filter((item: any) => getConsultaId(item) > minId)
        .sort((a: any, b: any) => getConsultaId(b) - getConsultaId(a));
    return getConsultaId(matches[0]);
}

function normalizeConsulta(consulta: any) {
    return {
        id_asociado: Number(consulta?.id_asociado ?? 0),
        id_medico: Number(consulta?.id_medico ?? 0),
        id_recibo: Number(consulta?.id_recibo ?? 0),
        tipo_consulta: consulta?.tipo_consulta,
        motivo: consulta?.motivo ?? null,
        diagnostico: consulta?.diagnostico ?? null,
        tratamiento: consulta?.tratamiento ?? null,
        aportacion: parseMoneyValue(consulta?.aportacion),
        ya_aporto: consulta?.ya_aporto ? 1 : 0,
        estatus: consulta?.estatus || "Pendiente",
        fecha_cita: normalizeDateTime(consulta?.fecha_cita),
    };
}

function normalizeEstudio(estudio: any, idConsulta: number) {
    return {
        id_asociado: Number(estudio?.id_asociado ?? 0),
        id_medico: estudio?.id_medico == null ? null : Number(estudio.id_medico),
        id_tipo_estudio: Number(estudio?.id_tipo_estudio ?? 0),
        id_consulta: idConsulta,
        laboratorio: estudio?.laboratorio ?? "",
        aportacion: parseMoneyValue(estudio?.aportacion),
        ya_aporto: estudio?.ya_aporto ? 1 : 0,
        fecha_cita: estudio?.fecha_cita ?? "",
        estatus: estudio?.estatus ?? "Pendiente",
        resultados: estudio?.resultados ?? "",
    };
}

function responseError(message: string, details?: unknown, status = 502) {
    return Response.json({ message: "Failed", error: message, details }, { status });
}

export async function POST(req: Request) {
    const body = await req.json();
    const consultas = Array.isArray(body?.consultas) ? body.consultas : [];
    const estudios = Array.isArray(body?.estudios) ? body.estudios : [];
    const consultaIdMap = new Map<string, number>();
    let consultasDbBefore: any[] = [];
    let consultasDbAfter: any[] = [];

    if (consultas.length === 0 && estudios.length === 0) {
        return Response.json({ message: "Success" });
    }

    if (consultas.length > 0) {
        try {
            consultasDbBefore = await fetchConsultas();
        } catch {
            consultasDbBefore = [];
        }
    }

    for (let index = 0; index < consultas.length; index++) {
        const consulta = consultas[index];
        const localRef = getLocalConsultaRef(
            consulta?.id_consulta_local ?? consulta?.id_consulta ?? consulta?.folio,
            index,
        );
        const payload = normalizeConsulta(consulta);
        let serviceResponse;
        try {
            serviceResponse = await postOrds("/services/agregarConsulta", payload);
        } catch (error) {
            return responseError("No se pudo conectar para agregar una consulta.", {
                error: error instanceof Error ? error.message : String(error),
                payload,
            });
        }
        const { res, body: responseBody } = serviceResponse;

        if (!res.ok) {
            return responseError("No se pudo agregar una consulta.", {
                status: res.status,
                response: responseBody,
                payload,
            }, res.status);
        }

        const returnedId = Number(
            responseBody?.id_consulta ??
            responseBody?.id ??
            responseBody?.data?.id_consulta ??
            responseBody?.data?.id,
        );
        if (Number.isFinite(returnedId) && returnedId > 0) {
            consultaIdMap.set(localRef, returnedId);
            continue;
        }

        try {
            consultasDbAfter = await fetchConsultas();
        } catch {
            consultasDbAfter = [];
        }

        const previousMaxId = consultasDbBefore
            .filter((item: any) => getConsultaAsociadoId(item) === payload.id_asociado)
            .reduce((max: number, item: any) => Math.max(max, getConsultaId(item)), 0);
        const createdId = findCreatedConsultaId(consultasDbAfter, payload, previousMaxId);
        if (createdId > 0) {
            consultaIdMap.set(localRef, createdId);
            consultasDbBefore = consultasDbAfter;
        }
    }

    const reciboId = Number(consultas[0]?.id_recibo ?? estudios[0]?.id_recibo ?? 0);
    if (consultaIdMap.size < consultas.length) {
        try {
            consultasDbAfter = await fetchConsultas();
        } catch (error) {
            return responseError("No se pudieron consultar las consultas creadas.", {
                error: error instanceof Error ? error.message : String(error),
                id_recibo: reciboId,
            });
        }

        consultas.forEach((consulta: any, index: number) => {
            const localRef = getLocalConsultaRef(
                consulta?.id_consulta_local ?? consulta?.id_consulta ?? consulta?.folio,
                index,
            );
            if (consultaIdMap.has(localRef)) return;

            const payload = normalizeConsulta(consulta);
            const previousMaxId = consultasDbBefore
                .filter((item: any) => getConsultaAsociadoId(item) === payload.id_asociado)
                .reduce((max: number, item: any) => Math.max(max, getConsultaId(item)), 0);
            const createdId = findCreatedConsultaId(consultasDbAfter, payload, previousMaxId);
            if (createdId > 0) {
                consultaIdMap.set(localRef, createdId);
            }
        });
    }

    for (const estudio of estudios) {
        const rawConsultaRef = estudio?.id_consulta_local ?? estudio?.id_consulta;
        const mappedId = consultaIdMap.get(String(rawConsultaRef));
        const numericId = Number(rawConsultaRef);
        const idConsulta = mappedId ?? (Number.isFinite(numericId) ? numericId : 0);

        if (!idConsulta) {
            return responseError("No se pudo relacionar el estudio con una consulta.", {
                consultaRef: rawConsultaRef,
                knownRefs: Array.from(consultaIdMap.entries()),
                reciboId,
                consultasLength: consultas.length,
                consultasDbBeforeLength: consultasDbBefore.length,
                consultasDbAfterLength: consultasDbAfter.length,
                consultasDbAfterSample: consultasDbAfter.slice(-5),
            }, 400);
        }

        const payload = normalizeEstudio(estudio, idConsulta);
        let serviceResponse;
        try {
            serviceResponse = await postOrds("/services/agregarEstudio", payload);
        } catch (error) {
            return responseError("No se pudo conectar para agregar un estudio.", {
                error: error instanceof Error ? error.message : String(error),
                payload,
            });
        }
        const { res, body: responseBody } = serviceResponse;

        if (!res.ok) {
            return responseError("No se pudo agregar un estudio.", {
                status: res.status,
                response: responseBody,
                payload,
            }, res.status);
        }
    }

    return Response.json({ message: "Success" });
}
