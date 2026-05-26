"use client";

import { useEffect, useState } from "react";
import ListaTabla from "./ListaTabla";
import ModalMedico, { type MedicoDetalle } from "./ModalMedico";
import type { FiltrosMedicosValues } from "./FiltrosMedicos";

type Estatus = "Activo" | "Inactivo";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-slate-100 text-slate-500",
};

const HEADERS = ["Nombre", "Teléfono", "Correo", "Estatus"];

type ListaMedicosProps = {
  filtros: FiltrosMedicosValues;
  refreshKey?: number;
};

function getStatusLabel(estatus: any): Estatus {
  if (estatus === 1 || estatus === "Activo") return "Activo";
  if (estatus === 0 || estatus === "Inactivo") return "Inactivo";
  return "Inactivo";
}

export default function ListaMedicos({ filtros, refreshKey }: ListaMedicosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rawData, setRawData] = useState<MedicoDetalle[]>([]);
  const [data, setData] = useState<MedicoDetalle[]>([]);

  useEffect(() => {
    async function loadMedicos() {
      const res = await fetch("/api/medicos/lista_medicos");
      if (res.ok) {
        const json = await res.json();
        const medicos: MedicoDetalle[] = Array.isArray(json) ? json : [];
        setRawData(medicos);
        setData(medicos);
      }
    }

    loadMedicos();
  }, [refreshKey]);

  useEffect(() => {
    setData(
      rawData.filter((m) => {
        const idMatch =
          filtros.id == null || filtros.id === 0
            ? true
            : String(m.id).includes(String(filtros.id));

        const nombreCompleto = `${m.nombre ?? ""} ${m.apellido ?? ""}`.toLowerCase();
        const nombreMatch =
          filtros.nombre === "" ||
          nombreCompleto.includes(filtros.nombre.toLowerCase());

        const estatusMatch =
          filtros.estatus === "" ||
          getStatusLabel(m.estatus) === filtros.estatus;

        return idMatch && nombreMatch && estatusMatch;
      }),
    );
  }, [filtros, rawData]);

  const rows = data.map((m) => {
    const label = getStatusLabel(m.estatus);
    return {
      key: String(m.id),
      cells: [
        `${m.nombre ?? ""} ${m.apellido ?? ""}`.trim(),
        m.telefono ?? "—",
        m.correo ?? "—",
        <span
          key="estatus"
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[label]}`}
        >
          {label}
        </span>,
      ],
    };
  });

  const selectedMedico =
    selectedIndex !== null && selectedIndex < data.length
      ? data[selectedIndex]
      : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ListaTabla
          headers={HEADERS}
          rows={rows}
          onRowClick={setSelectedIndex}
          emptyMessage={
            filtros.busqueda || filtros.estatus
              ? "Sin resultados para los filtros aplicados"
              : "No hay médicos registrados"
          }
        />
      </div>

      {selectedMedico !== null && selectedIndex !== null && (
        <ModalMedico
          open
          medico={selectedMedico}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
