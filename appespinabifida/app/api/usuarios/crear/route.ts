import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createUser } from "@/lib/db/user";

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
  const userRole = String(data.role || "").trim();

  if (!email || !password || !nombre || !userRole) {
    return new Response(JSON.stringify({ status: "failed", reason: "Faltan campos requeridos." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const created = await createUser({
    email,
    password,
    provider: "credentials",
    role: userRole,
    nombre,
  });

  if (!created) {
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
