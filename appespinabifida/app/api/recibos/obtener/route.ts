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
                asociado: r.asociado,
                fechaEmision: r.fechaemision,
                fechaLimite: r.fechalimite,
                montoTotal: r.montototal,
                montoPagado: r.montopagado,
                tipoPaciente: r.tipopaciente,
                descuentoPct: r.descuentopct,
                productos: JSON.parse(r.productos),
                exento: r.exento
            }
        })

        console.log(recibos)

        return Response.json(recibos)
    }
    return Response.json([]);
}