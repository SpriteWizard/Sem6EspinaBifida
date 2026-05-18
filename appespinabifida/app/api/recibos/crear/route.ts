export async function POST(req: Request){

    const body = await req.json();

    // Aqui se pone la llamada a ORACLE para insertar el recibo. La llamada debe de retornar el ID del recibo
    // insertado y eso es lo que se retorna

    return Response.json({id_recibo: 53})
}