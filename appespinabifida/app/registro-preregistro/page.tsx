"use client";

import { PreregistroRegistroForm } from "../../standalone-preregistro";
import type { PreregistroRegistroPayload } from "../../standalone-preregistro";

// ─── INTEGRACIÓN BACKEND ─────────────────────────────────────────────────────
// Cuando el endpoint esté listo:
//   1. Descomenta el fetch de abajo.
//   2. Elimina el console.log.
//
//   POST /api/asociados/preRegistro/crear    Body: PreregistroRegistroPayload
//        Response: { ok: boolean; result: string }
//
// Si el fetch lanza un error, el formulario lo captura y lo muestra al usuario.
// ─────────────────────────────────────────────────────────────────────────────

async function enviarPreregistro(data: PreregistroRegistroPayload): Promise<void> {
  const res = await fetch("/api/asociados/preRegistro/crear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (json.reason === "curp_pendiente") {
      throw new Error("Este CURP ya tiene un preregistro pendiente de revisión. Contacta a la asociación si crees que es un error.");
    }
    if (json.reason === "curp_asociado") {
      throw new Error("Este CURP ya está registrado como asociado. Contacta directamente a la asociación.");
    }
    throw new Error("No se pudo enviar el preregistro. Intenta de nuevo.");
  }
}

export default function RegistroPreregistroPage() {
  return <PreregistroRegistroForm onSubmit={enviarPreregistro} />;
}
