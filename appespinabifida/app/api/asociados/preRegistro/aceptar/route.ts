export async function PUT(req: Request){
    
    const { id} = await req.json();
    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/aceptarAsociado",{
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify({id: id}),
    });
    console.log(res);
    if (res.ok){
        return Response.json({status: "Success"});
    }
    return Response.json({status: "Failed"})
}