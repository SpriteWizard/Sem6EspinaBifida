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

export function parseFechaHora(isoString: string) {
  if (!isoString) return { fecha: null, hora: null };

  const [fecha, timePart] = isoString.split('T');
  const hora = timePart ? timePart.replace('Z', '') : null;

  return { fecha, hora };
}
