"use client";

import { Textarea } from "./ui/Textarea";

const OPCIONES = [
  "MIELOMENINGOCELE",
  "MENINGOCELE",
  "ENCEFALOCELE",
  "LIPOMENINGOCELE",
  "HIDROCEFALIA",
  "MICROCEFALIA",
  "ESPINA BÍFIDA OCULTA",
  "MEDULA ANCLADA",
] as const;

// El valor se guarda tal cual en la columna `padecimiento` como texto plano separado
// por coma y espacio: "MIELOMENINGOCELE, HIDROCEFALIA, texto libre".
// TODO backend: si en algún momento se necesita normalizar los padecimientos a columnas
// booleanas individuales en la BD, se debe parsear este string en el API route
// (/api/asociados/agregar y /api/asociados/editar) antes de enviarlo a Oracle,
// usando la misma lista OPCIONES como referencia.
function parseTokens(value: string): string[] {
  if (!value || value === "—") return [];
  // Split por coma (con o sin espacio) y quitar puntos finales por si el usuario
  // termina la lista con "," o "."
  return value
    .split(",")
    .map((t) => t.trim().replace(/\.+$/, "").trim())
    .filter(Boolean);
}

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function PadecimientoSelector({ value, onChange }: Props) {
  const tokens = parseTokens(value);

  function isChecked(opcion: string): boolean {
    return tokens.some((t) => t.toUpperCase() === opcion);
  }

  const hasOther = tokens.some(
    (t) => !OPCIONES.includes(t.toUpperCase() as (typeof OPCIONES)[number])
  );

  function toggle(opcion: string) {
    if (isChecked(opcion)) {
      const filtered = tokens.filter((t) => t.toUpperCase() !== opcion);
      onChange(filtered.join(", "));
    } else {
      onChange(tokens.length === 0 ? opcion : [...tokens, opcion].join(", "));
    }
  }

  const leftCol = OPCIONES.slice(0, 4);
  const rightCol = OPCIONES.slice(4);

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
        <div className="space-y-1.5">
          {leftCol.map((opcion) => (
            <label key={opcion} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked(opcion)}
                onChange={() => toggle(opcion)}
                className="w-4 h-4 accent-[#003c64] cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-800">{opcion}</span>
            </label>
          ))}
        </div>
        <div className="space-y-1.5">
          {rightCol.map((opcion) => (
            <label key={opcion} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked(opcion)}
                onChange={() => toggle(opcion)}
                className="w-4 h-4 accent-[#003c64] cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-800">{opcion}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={hasOther}
              disabled
              className="w-4 h-4 cursor-not-allowed"
            />
            <span className="text-sm font-medium text-gray-400 italic">Otro...</span>
          </label>
        </div>
      </div>
      <Textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Descripción clínica"
      />
    </div>
  );
}
