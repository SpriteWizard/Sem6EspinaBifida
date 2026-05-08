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
  return NextResponse.json(usuarios);
}
