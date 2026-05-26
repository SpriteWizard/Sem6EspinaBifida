const TIPOS_ZONA_VALIDOS = new Set(["urbano", "rural"]);

export async function POST(req: Request){
    const data = await req.json();

    if (!TIPOS_ZONA_VALIDOS.has(data?.tipo_zona)) {
        return Response.json(
            {
                status: "Failed",
                message: "Selecciona una zona valida para el recibo.",
            },
            { status: 400 },
        );
    }

    const res = await fetch ("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/recibos/nuevoRecibo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(data)
    })

    if (res.ok){
        const recibo_response = await res.json();
        if (recibo_response?.status === "Success"){
            return Response.json({status: "Success", id_recibo: recibo_response.id_recibo})
        }
        return Response.json({
            status: "Failed",
            id_recibo: recibo_response?.id_recibo ?? null,
            message: recibo_response?.message ?? "No se pudo agregar el recibo, intentelo nuevamente",
        })
    }

    return Response.json({status: "Failed", message: "No se pudo conectar con la base de datos, intentelo nuevamente mas adelante"})

}
