export async function PUT(req: Request){
    const data = await req.json();

    const postAttempt = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/ligarConsulta", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(data)
    });

    if (postAttempt.ok){
        return Response.json({message: "Success"});
    }
    return Response.json({message: "Failed"});

}