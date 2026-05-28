import { NextRequest } from "next/server";

const ORDS_BASE = "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin";

function authHeader() {
  return "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64");
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${ORDS_BASE}/laboratorios/toggleLaboratorio`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader(),
    },
    body: JSON.stringify(body),
  });

  let data: any = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch { /* respuesta vacía o no-JSON */ }

  if (!res.ok) {
    return Response.json(
      { status: "error", reason: data.reason ?? "Error al cambiar estatus" },
      { status: res.status },
    );
  }

  return Response.json({ status: "ok" });
}
