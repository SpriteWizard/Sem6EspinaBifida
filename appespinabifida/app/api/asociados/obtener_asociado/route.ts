export async function GET(request: Request){
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")
    const res = await fetch(`https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/obtenerAsociado?asociado_input=${id}`,{
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        }
    });
    const response = await res.json();
    return Response.json(response.items[0]);
}