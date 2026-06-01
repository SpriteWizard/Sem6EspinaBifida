// ─── Estatus ──────────────────────────────────────────────────────────────────

export const ESTATUS_CLASSES: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Completado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-rose-100 text-rose-800",
};

export function EstatusBadge({ estatus }: { estatus: string }) {
  const cls = ESTATUS_CLASSES[estatus] ?? "bg-slate-100 text-slate-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {estatus}
    </span>
  );
}

// ─── Laboratorios ─────────────────────────────────────────────────────────────

export const LABORATORIOS: Record<string, string> = {
  L01: "Lab. Médico Cerrus",
  L02: "Centro de Imagen UDEM",
  L03: "Hospital San José TEC",
  L04: "Laboratorio Clínico Lomas",
  L05: "Diagnóstica del Norte",
};

// ─── Fecha / Hora ─────────────────────────────────────────────────────────────

export function normalizeDateString(raw: string | null | undefined) {
  const value = String(raw ?? "").trim()
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const normalized = value.replace(" ", "T")
  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) {
    const [fecha] = normalized.split("T")
    return fecha
  }

  return parsed.toLocaleDateString("en-CA")
}

export function getLocalTimestamp(raw: string | null | undefined) {
  const value = String(raw ?? "").trim()
  if (!value) return 0
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day).getTime()
  }

  const normalized = value.replace(" ", "T")
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

export function parseFechaHora(isoString: string) {
  if (!isoString) return { fecha: null, hora: null };

  const raw = String(isoString).trim().replace(" ", "T")
  if (!raw.includes("T")) return { fecha: raw, hora: null }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    const [fecha, timePart] = raw.split("T")
    return { fecha, hora: timePart ? timePart.replace("Z", "") : null }
  }

  const fecha = parsed.toLocaleDateString("en-CA")
  const hora = parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return { fecha, hora }
}
