export async function GET(){
    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/recibos/lista_recibos_mini", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        }
    })

    if (res.ok){
        return Response.json((await res.json()).items);
    }
    return Response.json([]);

}