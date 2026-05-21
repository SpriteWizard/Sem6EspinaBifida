import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || role !== "superadmin") {
    return new Response(JSON.stringify({ status: "forbidden", reason: "Acceso denegado." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await req.json();
  const email = String(data.email || "").trim();
  const password = String(data.password || "").trim();
  const nombre = String(data.nombre || "").trim();
  const apellido = String(data.apellido || "").trim();
  const userRole = String(data.role || "").trim();
  const telefono = String(data.telefono || "").trim();

  if (!email || !password || !nombre || !apellido || !userRole || !telefono) {
    return new Response(JSON.stringify({ status: "failed", reason: "Faltan campos requeridos." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    email,
    password: hashedPassword,
    provider: "credentials",
    role: userRole,
    nombre,
    apellido,
    telefono,
  };
  
  const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/usuarios/nuevoUsuario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
    },
    body: JSON.stringify(user)
  });


  if (!res.ok) {
    return new Response(JSON.stringify({ status: "failed", reason: "No se pudo crear el usuario." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
