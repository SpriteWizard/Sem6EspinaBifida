export async function GET(){
    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/inicio/obtenerData",{
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        }
    })

    if (res.ok){

        const data = JSON.parse((await res.json()).items[0].calendario)
        
        return Response.json({message: "Success", data: data});
    }

    return Response.json({message: "Failed", data: {}})
}