export async function PUT(req: Request) {
    const data = await req.json();
    const rawStatus = data.estatus;
    const normalizedStatus = String(rawStatus).toLowerCase();
    const isCurrentlyActive = ["1", "true", "activo"].includes(normalizedStatus);
    const nextStatus = isCurrentlyActive ? 0 : 1;

    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/usuarios/toggleUsuario",{
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body : JSON.stringify({
            id: data.id,
            status: nextStatus
        })
    })

    console.log(res);
        
    if (res.ok){
        return Response.json({status: "Success"});
    }

    return Response.json({status: "Failed"});
}
