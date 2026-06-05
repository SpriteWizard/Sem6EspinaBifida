type agregar_servicio_data = {
    tipo: number,
    data: estudio_data | consulta_data
}

type estudio_data = {
    id_estudio: number,
    id_asociado: number,
    id_medico: number,
    id_tipo_estudio: number,
    laboratorio: string,
    aportacion: number,
    ya_aporto: 1 | 0,
    fecha_cita: string,
    estatus: string,
    resultados: string
}

type consulta_data = {
    id_consulta: number,
    id_asociado: number,
    id_medico: number,
    id_recibo: number,
    tipo_consulta: "primera" | "seguimiento",
    motivo: string,
    diagnostico: string,
    tratamiento: string,
    aportacion: number,
    ya_aporto: 1 | 0,
    estatus: string,
    fecha: string
}

export async function PUT(request: Request){

    const body: agregar_servicio_data = await request.json();

    const url = (body.tipo == 0)? "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/editarConsulta" : "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/services/editarEstudio";
    const res = await fetch(url, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(body.data),
    });
    const insert_response = (res.ok) ? "Success" : "Failed";
    return Response.json(insert_response);
}