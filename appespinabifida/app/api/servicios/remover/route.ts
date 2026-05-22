type deleteData = {
    tipo: number,
    id: number
};

export async function DELETE(request: Request){
    const deleteData: deleteData = await request.json();
    const url = (deleteData.tipo == 0)? "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/removerConsulta" : "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/removerEstudio";

    const res = await fetch(url,{
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify({servicio_to_delete: deleteData.id})
    });
    const status = (res.ok) ? "Element eliminated correctly" : "Element could not be eliminated, try again";
    return Response.json(status);
}