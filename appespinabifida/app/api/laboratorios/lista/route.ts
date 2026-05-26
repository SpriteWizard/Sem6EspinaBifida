const ORDS_BASE = "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin";

function authHeader() {
  return "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64");
}

export async function GET() {
  const res = await fetch(`${ORDS_BASE}/laboratorios/obtenerLaboratorios`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader(),
    },
  });

  const data = await res.json();
  return Response.json(data.items ?? []);
}
