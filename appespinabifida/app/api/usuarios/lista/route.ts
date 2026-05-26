import { NextResponse } from "next/server";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function getStatusLabel(estatus: any) {
  if (estatus == 1) return "Activo";
  if (estatus == 0) return "Inactivo";
  return String(estatus);
}

const usuarios = [
  {
    id: "U-1001",
    nombre: "Andrea Reyes",
    email: "andrea.reyes@ejemplo.com",
    rol: "Administrador",
    estatus: "Activo",
    fechaAlta: "2025-01-12",
    ultimoAcceso: "2026-04-29",
    telefono: "81 1234 5678",
    empresa: "Asociación Espina Bífida",
  },
  {
    id: "U-1002",
    nombre: "Carlos Pérez",
    email: "carlos.perez@ejemplo.com",
    rol: "Secretaría",
    estatus: "Inactivo",
    fechaAlta: "2024-07-28",
    ultimoAcceso: "2026-01-18",
    telefono: "81 8765 4321",
  },
  {
    id: "U-1003",
    nombre: "Mariana López",
    email: "mariana.lopez@ejemplo.com",
    rol: "Usuario",
    estatus: "Pendiente",
    fechaAlta: "2026-02-08",
    ultimoAcceso: "2026-03-12",
    telefono: "81 3344 5566",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = parsePositiveInt(searchParams.get("cursor"), 0);
  const limit = parsePositiveInt(searchParams.get("limit"), 5);
  const idFilter = (searchParams.get("id") ?? "").trim();
  const nombreFilter = (searchParams.get("nombre") ?? "").trim().toLowerCase();
  const fechaFilter = (searchParams.get("fecha") ?? "").trim();
  const estatusFilter = (searchParams.get("estatus") ?? "").trim();

  const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/usuarios/lista_usuarios",{
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
    }
  })

  if (res.ok) {
    const data = await res.json();
    const usuarios = data.items || [];

    const filtrados = usuarios.filter((element: any) => {
      const idMatch = !idFilter || String(element.id ?? "").includes(idFilter);
      const nombreCompleto = `${element.nombre ?? ""} ${element.apellidos ?? ""}`.toLowerCase();
      const nombreMatch = !nombreFilter || nombreCompleto.includes(nombreFilter);
      const fechaAlta = String(element.fechaalta ?? "").split("T")[0];
      const fechaMatch = !fechaFilter || fechaAlta === fechaFilter;
      const estatusMatch = !estatusFilter || getStatusLabel(element.estatus) === estatusFilter;
      return idMatch && nombreMatch && fechaMatch && estatusMatch;
    });

    const paged = filtrados.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < filtrados.length ? String(cursor + limit) : null;
    return NextResponse.json({ items: paged, nextCursor });
  }

  return NextResponse.json({ items: [], nextCursor: null });
}

