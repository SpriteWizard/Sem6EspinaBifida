import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || role !== "superadmin") {
    return new Response(JSON.stringify({ status: "forbidden", reason: "Acceso denegado." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await req.json();
  const res = await fetch(
    "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/usuarios/editarUsuario",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
      },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    return new Response(JSON.stringify({ status: "failed", reason: "No se pudo editar el usuario." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
