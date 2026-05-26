import { NextRequest } from "next/server";

const ORDS_BASE = "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin";

function authHeader() {
  return "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64");
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${ORDS_BASE}/medicos/editarMedico`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader(),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return Response.json(
      { status: "failed", reason: data.message ?? "Error al editar médico" },
      { status: res.status },
    );
  }

  return Response.json({ status: "ok" });
}
