function parsePositiveInt(value: string | null, fallback: number) {
    const parsed = Number(value ?? "");
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.floor(parsed);
}

function derivarEstatus(montoPagado: number, montoTotal: number) {
    if (montoPagado <= 0) return "Pendiente";
    if (montoPagado >= montoTotal) return "Pagado";
    return "Pagado parcialmente";
}

export async function GET(request: Request){
    const { searchParams } = new URL(request.url);
    const cursor = parsePositiveInt(searchParams.get("cursor"), 0);
    const limit = parsePositiveInt(searchParams.get("limit"), 5);
    const idFilter = (searchParams.get("id") ?? "").trim().toLowerCase();
    const nombreFilter = (searchParams.get("nombre") ?? "").trim().toLowerCase();
    const fechaFilter = (searchParams.get("fecha") ?? "").trim();
    const estatusFilter = (searchParams.get("estatus") ?? "todos").trim();

    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/recibos/lista_recibos", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        }
    })
    if (res.ok){
        const data = await res.json();

        const recibos = data.items.map((r: any) => {
            return {
                id: r.id_recibo,
                reciboId: r.id_recibo,
                asociado: r.asociado,
                fechaEmision: r.fechaemision ?? r.fecha_emision ?? r.fechaEmision,
                fechaLimite: r.fechalimite ?? r.fecha_limite ?? r.fechaLimite,
                montoTotal: r.montototal,
                montoPagado: r.montopagado,
                tipoPaciente: r.tipopaciente,
                descuentoPct: r.descuentopct,
                productos: JSON.parse(r.productos),
                exento: r.exento
            }
        })

        recibos.sort((a: any, b: any) => {
            const byId = Number(b.id ?? 0) - Number(a.id ?? 0)
            if (byId !== 0) return byId
            const dateA = String(a.fechaEmision ?? '')
            const dateB = String(b.fechaEmision ?? '')
            return dateB.localeCompare(dateA)
        })

        const filtrados = recibos.filter((r: any) => {
            if (idFilter && !String(r.id).toLowerCase().includes(idFilter)) return false;
            if (nombreFilter && !String(r.asociado ?? "").toLowerCase().includes(nombreFilter)) return false;
            const fechaEmision = String(r.fechaEmision ?? "").split("T")[0];
            if (fechaFilter && fechaEmision !== fechaFilter) return false;
            if (estatusFilter !== "todos") {
                const estatus = derivarEstatus(Number(r.montoPagado ?? 0), Number(r.montoTotal ?? 0));
                if (estatus !== estatusFilter) return false;
            }
            return true;
        });

        const paged = filtrados.slice(cursor, cursor + limit);
        const nextCursor = cursor + limit < filtrados.length ? String(cursor + limit) : null;

        return Response.json({ items: paged, nextCursor });
    }
    return Response.json({ items: [], nextCursor: null });
}