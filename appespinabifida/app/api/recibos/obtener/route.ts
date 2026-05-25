export async function GET(){
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

        return Response.json(recibos)
    }
    return Response.json([]);
}