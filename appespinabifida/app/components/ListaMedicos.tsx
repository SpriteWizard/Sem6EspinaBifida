"use client";

import { useEffect, useState } from "react";
import ListaTabla from "./ListaTabla";
import ModalMedico, { type MedicoDetalle } from "./ModalMedico";
import { Button } from "./ui/Button";
import type { FiltrosMedicosValues } from "./FiltrosMedicos";

const PAGE_SIZE = 5;

type Estatus = "Activo" | "Inactivo";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-red-500/10 text-red-500",
};

const HEADERS = ["ID", "Nombre", "Teléfono", "Correo", "Estatus"];

type ListaMedicosProps = {
  filtros: FiltrosMedicosValues;
  refreshKey?: number;
  onSuccess?: () => void;
};

function getStatusLabel(estatus: any): Estatus {
  if (estatus === 1 || estatus === "Activo") return "Activo";
  if (estatus === 0 || estatus === "Inactivo") return "Inactivo";
  return "Inactivo";
}

export default function ListaMedicos({ filtros, refreshKey, onSuccess }: ListaMedicosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rawData, setRawData] = useState<MedicoDetalle[]>([]);
  const [data, setData] = useState<MedicoDetalle[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    setVisibleCount(PAGE_SIZE);
    setData(
      rawData.filter((m) => {
        const idMatch =
          filtros.id == null || filtros.id === 0
            ? true
            : String(m.id_medico).includes(String(filtros.id));

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

  const visible = data.slice(0, visibleCount);

  const rows = visible.map((m, i) => {
    const label = getStatusLabel(m.estatus);
    return {
      key: String(m.id_medico ?? i),
      cells: [
        m.id_medico != null ? `MED-${m.id_medico}` : "—",
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
    selectedIndex !== null && selectedIndex < visible.length
      ? visible[selectedIndex]
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
              : "No hay médicos registrados"
          }
        />
        <div className="flex justify-center p-5">
          <Button
            variant="secondary"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            disabled={visibleCount >= data.length}
          >
            {visibleCount < data.length ? "Cargar más datos" : "No hay más resultados"}
          </Button>
        </div>
      </div>

      {selectedMedico !== null && selectedIndex !== null && (
        <ModalMedico
          open
          medico={selectedMedico}
          onClose={() => setSelectedIndex(null)}
          onSuccess={() => { setSelectedIndex(null); onSuccess?.(); }}
        />
      )}
    </>
  );
}
