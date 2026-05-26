const ORDS_BASE = "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin";

function authHeader() {
    return "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64");
}

async function ordsGet(path: string) {
    const res = await fetch(`${ORDS_BASE}/${path}`, {
        headers: { "Content-Type": "application/json", Authorization: authHeader() },
        next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`ORDS ${path} → ${res.status}`);
    return res.json();
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
        const k = key(item) ?? "Desconocido";
        counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
}

function monthLabel(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function last6Months() {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
}

export async function GET() {
    try {
        const [asociadosRaw, consultasRaw, inventarioRaw] = await Promise.all([
            ordsGet("asociados/obtenerListaAsociados").then((d) => d.items ?? []),
            ordsGet("services/obtenerConsultas").then((d) => d.items ?? []),
            ordsGet("inventario/obtenerInventario").then((d) => d.items ?? []),
        ]);

        // ── Asociados ──────────────────────────────────────────────────────────
        const total = asociadosRaw.length;
        const activos = asociadosRaw.filter((a: any) => String(a.activo).toLowerCase() === "activo").length;

        const porSexo = countBy(asociadosRaw, (a: any) =>
            a.sexo === "M" ? "Masculino" : a.sexo === "F" ? "Femenino" : "No especificado"
        );

        const porEstado = countBy(asociadosRaw, (a: any) => a.estado ?? "Desconocido");
        const topEstados = Object.entries(porEstado)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([estado, count]) => ({ estado, count }));

        const conValvula = asociadosRaw.filter((a: any) => Number(a.tiene_valvula) === 1).length;

        const padecimientosCount: Record<string, number> = {};
        for (const a of asociadosRaw) {
            try {
                const pads: string[] = JSON.parse(a.padecimientos ?? "[]");
                for (const p of pads) {
                    if (p) padecimientosCount[p] = (padecimientosCount[p] ?? 0) + 1;
                }
            } catch { /* skip malformed */ }
        }
        const topPadecimientos = Object.entries(padecimientosCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([nombre, count]) => ({ nombre, count }));

        const months = last6Months();
        const nuevosRaw = countBy(asociadosRaw, (a: any) =>
            a.fecha_alta ? monthLabel(a.fecha_alta) : "Desconocido"
        );
        const nuevosPorMes = months.map((m) => ({ mes: m, count: nuevosRaw[m] ?? 0 }));

        // ── Consultas ──────────────────────────────────────────────────────────
        const totalConsultas = consultasRaw.length;
        const consultasRawCount = countBy(consultasRaw, (c: any) =>
            c.fecha ? monthLabel(c.fecha) : "Desconocido"
        );
        const consultasPorMes = months.map((m) => ({ mes: m, count: consultasRawCount[m] ?? 0 }));

        // ── Inventario ─────────────────────────────────────────────────────────
        const totalArticulos = inventarioRaw.length;
        const stockTotal = inventarioRaw.reduce((sum: number, i: any) => sum + (Number(i.stock) || 0), 0);

        return Response.json({
            asociados: {
                total,
                activos,
                inactivos: total - activos,
                porSexo,
                topEstados,
                conValvula,
                sinValvula: total - conValvula,
                topPadecimientos,
                nuevosPorMes,
            },
            consultas: {
                total: totalConsultas,
                porMes: consultasPorMes,
            },
            inventario: {
                totalArticulos,
                stockTotal,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error al obtener métricas";
        return Response.json({ error: message }, { status: 500 });
    }
}
