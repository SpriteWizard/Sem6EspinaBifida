/**
 * Carpeta autocontenida para copiar a otro proyecto (Next.js + React + Tailwind recomendado).
 *
 * Uso típico en una página:
 *   import { PreregistroRegistroForm } from "@/standalone-preregistro";
 *   export default function Page() {
 *     return (
 *       <PreregistroRegistroForm
 *         onSubmit={async (data) => {
 *           const res = await fetch("/api/preregistros", { method: "POST", body: JSON.stringify(data) });
 *           if (!res.ok) throw new Error("Error al guardar");
 *         }}
 *       />
 *     );
 *   }
 *
 * Requisitos: React 18+, "use client" en el padre si la página es servidor y pasas callbacks.
 */

export { PreregistroRegistroForm } from "./PreregistroRegistroForm";
export type { PreregistroRegistroFormProps } from "./PreregistroRegistroForm";
export type { PreregistroRegistroPayload } from "./types";
export { emptyPreregistroPayload } from "./types";
