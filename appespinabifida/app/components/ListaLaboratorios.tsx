"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import ListaTabla from "./ListaTabla";
import ModalLaboratorio, { type LaboratorioDetalle } from "./ModalLaboratorio";
import type { FiltrosLaboratoriosValues } from "./FiltrosLaboratorios";

type Estatus = "Activo" | "Inactivo";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-red-500/10 text-red-500",
};

const HEADERS = ["ID", "Nombre", "Dirección", "Teléfono", "Estatus"];
const PAGE_SIZE = 5;

type ListaLaboratoriosProps = {
  filtros: FiltrosLaboratoriosValues;
  refreshKey?: number;
  onSuccess?: () => void;
};

function getStatusLabel(estatus: any): Estatus {
  if (estatus === 1 || estatus === "Activo") return "Activo";
  return "Inactivo";
}

export default function ListaLaboratorios({ filtros, refreshKey, onSuccess }: ListaLaboratoriosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rawData, setRawData] = useState<LaboratorioDetalle[]>([]);
  const [data, setData] = useState<LaboratorioDetalle[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    setVisibleCount(PAGE_SIZE);
    setData(
      rawData.filter((lab) => {
        const idMatch =
          filtros.id == null || filtros.id === 0
            ? true
            : String(lab.id_laboratorio).includes(String(filtros.id));

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

  const visible = data.slice(0, visibleCount);

  const rows = visible.map((lab, i) => {
    const label = getStatusLabel(lab.estatus);
    return {
      key: String(lab.id_laboratorio ?? i),
      cells: [
        `LAB-${lab.id_laboratorio}`,
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
              : "No hay laboratorios registrados"
          }
        />
      </div>

      {visibleCount < data.length && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Cargar más datos
          </Button>
        </div>
      )}

      {selectedLaboratorio !== null && selectedIndex !== null && (
        <ModalLaboratorio
          open
          laboratorio={selectedLaboratorio}
          onClose={() => setSelectedIndex(null)}
          onSuccess={() => {
            setSelectedIndex(null);
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
