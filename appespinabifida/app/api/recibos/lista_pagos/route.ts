export async function GET(){
    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/recibos/lista_pagos",{
        method: "GET",
        headers :{
            "Content-Type": "application/json",
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        }
    });
    if (res.ok){

        const rawData = (await res.json()).items;

        const pagos = rawData.map((pago: any) =>{
            return {
                id: pago.id,
                idRecibo: pago.id_recibo,
                monto: pago.monto,
                metodoPago: pago.metodopago,
                fechaPago: pago.fecha_pago
            }
        });

        return Response.json({message: "Success", data: pagos});

    }

    return Response.json({message: "Failed"});
}