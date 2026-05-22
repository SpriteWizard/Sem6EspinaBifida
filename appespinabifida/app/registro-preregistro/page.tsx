"use client";

import { PreregistroRegistroForm } from "../../standalone-preregistro";
import type { PreregistroRegistroPayload } from "../../standalone-preregistro";


async function enviarPreregistro(data: PreregistroRegistroPayload): Promise<void> {
  const res = await fetch("/api/asociados/preRegistro/crear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo enviar el preregistro. Intenta de nuevo.");

}

export default function RegistroPreregistroPage() {
  return <PreregistroRegistroForm onSubmit={enviarPreregistro} />;
}
