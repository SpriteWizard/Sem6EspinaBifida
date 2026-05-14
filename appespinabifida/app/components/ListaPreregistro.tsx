"use client";

import { useState, useEffect } from "react";
import ListaTabla from "./ListaTabla";
import ModalPreregistro from "./ModalPreregistro";

import { type FiltrosPreregistroValues } from "./FiltrosPreregistro";

// ─── INTEGRACIÓN BACKEND ─────────────────────────────────────────────────────
// Tres endpoints necesarios. Cuando estén listos, reemplaza las secciones
// marcadas con "TODO:" en el código:
//
//   GET  /api/preregistros/lista
//        Response: PreregistroDetalle[]
//
//   POST /api/preregistros/aceptar    Body: { id: string }
//        Response: { ok: boolean }
//
//   POST /api/preregistros/anular     Body: { id: string; nota: string }
//        Response: { ok: boolean }
//
// Mientras no haya backend, las acciones se imprimen en consola.
// ─────────────────────────────────────────────────────────────────────────────

export type EstatusPreregistro = "Pendiente" | "Anulado";

const badgeColors: Record<EstatusPreregistro, string> = {
  Pendiente: "bg-yellow-600/10 text-yellow-600",
  Anulado:   "bg-red-500/10 text-red-500",
};

export interface PreregistroDetalle {
  // ── Campos base ──────────────────────────────────────────────────────────
  id: string;
  nombre: string;
  fechaSolicitud: string;
  estatus: EstatusPreregistro;
  notaanulacion?: string;

  // ── Datos generales (obligatorio) ─────────────────────────────────────────
  fechaNacimiento: string;
  sexo: string;
  curp: string;
  correo: string;
  telefono: string;
  nombrePadreMadre: string;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };

  // ── Dirección (opcional) ──────────────────────────────────────────────────
  direccion?: string;
  ciudad?: string;
  estado?: string;
  cp?: string;

  // ── Historial médico (opcional) ───────────────────────────────────────────
  lugarNacimiento?: string;
  hospital?: string;
  padecimiento?: string;
  tipoSangre?: string;
  valvula?: boolean;
}

// TODO: Eliminar datos dummy cuando el endpoint GET /api/preregistros/lista esté listo.
// Cada caso cubre una etapa de vida distinta y refleja qué campos opcionales
// puede o no haber llenado el solicitante.
const DUMMY_PREREGISTROS: PreregistroDetalle[] = [
];

const HEADERS = ["ID", "Nombre", "Fecha de solicitud", "Estatus"];

type ListaPreregistroProps = {
  filtros: FiltrosPreregistroValues;
};

export default function ListaPreregistro({ filtros }: ListaPreregistroProps) {
  const [rawData, setRawData] = useState<PreregistroDetalle[]>([]);
  const [data, setData] = useState<PreregistroDetalle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/asociados/preRegistro/lista");
        if (res.ok) {
          const json = await res.json();
          setRawData(json);
          setData(json);
          return;
        }
      } catch (error) {
        console.error("Error fetching preregistros:", error);
      }
      setRawData(DUMMY_PREREGISTROS);
      setData(DUMMY_PREREGISTROS);
    };

    fetchData();
  }, []);

  useEffect(() => {
    setData(rawData.filter((el) => {
      const idMatch     = !filtros.id || filtros.id === 0 || filtros.id === Number(el.id.replace("PR-", ""));
      const nombreMatch = !filtros.nombre  || el.nombre.includes(filtros.nombre);
      const fechaMatch  = !filtros.fecha   || filtros.fecha === el.fechaSolicitud;
      const statusMatch = !filtros.estatus || filtros.estatus === el.estatus;
      return idMatch && nombreMatch && fechaMatch && statusMatch;
    }));
  }, [filtros, rawData]);

  const rows = data.map((row) => ({
    key: row.id,
    cells: [
      row.id,
      row.nombre,
      row.fechaSolicitud,
      <span
        key="estatus"
        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[row.estatus]}`}
      >
        {row.estatus}
      </span>,
    ],
  }));

  const selectedPreregistro = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ListaTabla
          headers={HEADERS}
          rows={rows}
          onRowClick={setSelectedIndex}
        />
      </div>

      {selectedPreregistro !== null && selectedIndex !== null && (
        <ModalPreregistro
          preregistro={selectedPreregistro}
          onClose={() => setSelectedIndex(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedIndex(selectedIndex - 1) : undefined}
          onNext={selectedIndex < data.length - 1 ? () => setSelectedIndex(selectedIndex + 1) : undefined}
          onAceptar={async (id) => {
            await fetch("/api/asociados/preRegistro/aceptar", { method: "PUT", body: JSON.stringify({ id: id }) });
            console.log("[preregistro] Aceptar →", JSON.stringify({ id }, null, 2));
            setRawData((prev) => prev.filter((p) => p.id !== id));
            setSelectedIndex(null);
          }}
          onAnular={async (id, nota) => {
            await fetch("/api/asociados/preRegistro/anular", { method: "PUT", body: JSON.stringify({ id: id, razon: nota }) });
            console.log("[preregistro] Anular →", JSON.stringify({ id, nota }, null, 2));
            setRawData((prev) =>
              prev.map((p) =>
                p.id === id ? { ...p, estatus: "Anulado" as const, notaanulacion: nota } : p
              )
            );
            setSelectedIndex(null);
          }}
        />
      )}
    </>
  );
}
