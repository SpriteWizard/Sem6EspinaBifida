"use client";

import { useEffect, useState } from "react";
import ListaTabla from "./ListaTabla";
import ModalLaboratorio, { type LaboratorioDetalle } from "./ModalLaboratorio";
import type { FiltrosLaboratoriosValues } from "./FiltrosLaboratorios";

type Estatus = "Activo" | "Inactivo";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-slate-100 text-slate-500",
};

const HEADERS = ["ID", "Nombre", "Dirección", "Teléfono", "Estatus"];

type ListaLaboratoriosProps = {
  filtros: FiltrosLaboratoriosValues;
  refreshKey?: number;
};

function getStatusLabel(estatus: any): Estatus {
  if (estatus === 1 || estatus === "Activo") return "Activo";
  return "Inactivo";
}

export default function ListaLaboratorios({ filtros, refreshKey }: ListaLaboratoriosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rawData, setRawData] = useState<LaboratorioDetalle[]>([]);
  const [data, setData] = useState<LaboratorioDetalle[]>([]);

  useEffect(() => {
    async function loadLaboratorios() {
      const res = await fetch("/api/laboratorios/lista");
      if (res.ok) {
        const json = await res.json();
        const labs: LaboratorioDetalle[] = Array.isArray(json) ? json : [];
        setRawData(labs);
        setData(labs);
      }
    }

    loadLaboratorios();
  }, [refreshKey]);

  useEffect(() => {
    setData(
      rawData.filter((lab) => {
        const idMatch =
          filtros.id == null || filtros.id === 0
            ? true
            : String(lab.id).includes(String(filtros.id));

        const nombreMatch =
          filtros.nombre === "" ||
          (lab.nombre ?? "").toLowerCase().includes(filtros.nombre.toLowerCase());

        const estatusMatch =
          filtros.estatus === "" ||
          getStatusLabel(lab.estatus) === filtros.estatus;

        return idMatch && nombreMatch && estatusMatch;
      }),
    );
  }, [filtros, rawData]);

  const rows = data.map((lab, i) => {
    const label = getStatusLabel(lab.estatus);
    return {
      key: String(lab.id ?? i),
      cells: [
        lab.id ?? "—",
        lab.nombre ?? "—",
        lab.direccion ?? "—",
        lab.telefono ?? "—",
        <span
          key="estatus"
          className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[label]}`}
        >
          {label}
        </span>,
      ],
    };
  });

  const selectedLaboratorio =
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
            filtros.id || filtros.nombre || filtros.estatus
              ? "Sin resultados para los filtros aplicados"
              : "No hay laboratorios registrados"
          }
        />
      </div>

      {selectedLaboratorio !== null && selectedIndex !== null && (
        <ModalLaboratorio
          open
          laboratorio={selectedLaboratorio}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
