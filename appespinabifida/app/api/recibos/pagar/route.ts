import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; // wherever your auth config is

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    const data = await req.json();

    const nuevoPago = {
        idRecibo: Number(data.idRecibo),
        monto: data.monto,
        metodoPago: data.metodoPago,
        fechaPago: data.fecha,
        idUsuario: (session?.user as any).id
    }

    const sendData = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/recibos/nuevoPago", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(nuevoPago)
    })
    console.log(sendData)

    if (sendData.ok){
        return Response.json({message: "Success"});
    }
    return Response.json({message: "Failed"});
    
}