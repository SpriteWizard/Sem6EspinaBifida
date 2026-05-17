export async function POST(req: Request){
    const body = await req.json();

    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/agregarServiciosConjuntos",{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(body)
    })
    console.log(body);
    console.log(res);

    if (res.ok){
        return Response.json({message: "Success"})
    }
    return Response.json({message: "Failed"});
}