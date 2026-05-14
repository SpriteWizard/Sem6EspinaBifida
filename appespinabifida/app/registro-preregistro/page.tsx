"use client";

import { PreregistroRegistroForm } from "../../standalone-preregistro";
import type { PreregistroRegistroPayload } from "../../standalone-preregistro";

// ─── INTEGRACIÓN BACKEND ─────────────────────────────────────────────────────
// Cuando el endpoint esté listo:
//   1. Descomenta el fetch de abajo.
//   2. Elimina el console.log.
//
//   POST /api/preregistros/crear    Body: PreregistroRegistroPayload
//        Response: { ok: boolean; id: string }
//
// Si el fetch lanza un error, el formulario lo captura y lo muestra al usuario.
// ─────────────────────────────────────────────────────────────────────────────

async function enviarPreregistro(data: PreregistroRegistroPayload): Promise<void> {
  // TODO: descomentar cuando el backend esté listo:
  // const res = await fetch("/api/preregistros/crear", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("No se pudo enviar el preregistro. Intenta de nuevo.");

  console.log("[preregistro] Crear →", JSON.stringify(data, null, 2));
}

export default function RegistroPreregistroPage() {
  return <PreregistroRegistroForm onSubmit={enviarPreregistro} />;
}
