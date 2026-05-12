import { NextResponse } from "next/server";

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

export async function GET() {
  const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/usuarios/lista_usuarios",{
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
    }
  })

  if (res.ok) {
    const data = await res.json();
    const usuarios = data.items
    return Response.json({
      res: "Success",
      usuarios: usuarios
    })
  }

  else{
    return Response.json({
      res: "Failed",
      usuarios: []
    })
  }
}
