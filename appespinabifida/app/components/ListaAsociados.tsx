"use client";

import { useState, useEffect } from "react";
import ListaTabla from "./ListaTabla";
import ModalAsociado, { type AsociadoDetalle } from "./ModalAsociado";
import { Button } from "./ui/Button";

type Estatus = "Activo" | "Inactivo" | "Pendiente" | "Anulado";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-red-500/10 text-red-500",
  Pendiente: "bg-yellow-600/10 text-yellow-600",
  Anulado: "bg-red-500/10 text-red-500"
};

const HEADERS = ["ID", "Nombre", "Estatus", "Fecha de alta"];

interface Filters {
  id: number | null;
  nombre: string;
  fecha: string;
  estatus: string;
}

type ListaAsociadosProps = {
  onUpdateAsociado?: (index: number, next: AsociadoDetalle) => void;
  filtros: Filters;
};

export default function ListaAsociados({ onUpdateAsociado, filtros }: ListaAsociadosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [items, setItems] = useState<AsociadoDetalle[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSelectedIndex(null);
    setLoading(true);
    setItems([]);
    setNextCursor(null);

    const params = new URLSearchParams({
      cursor: "0",
      limit: "5",
      id: String(filtros.id ?? 0),
      nombre: filtros.nombre,
      fecha: filtros.fecha,
      estatus: filtros.estatus,
    });

    fetch(`/api/asociados/lista_asociados?${params}`)
      .then((r) => r.json())
      .then(({ items: newItems, nextCursor: nc }) => {
        if (cancelled) return;
        setItems(newItems ?? []);
        setNextCursor(nc ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filtros]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        cursor: nextCursor,
        limit: "5",
        id: String(filtros.id ?? 0),
        nombre: filtros.nombre,
        fecha: filtros.fecha,
        estatus: filtros.estatus,
      });
      const res = await fetch(`/api/asociados/lista_asociados?${params}`);
      const { items: more, nextCursor: nc } = await res.json();
      setItems((prev) => [...prev, ...more]);
      setNextCursor(nc ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  const rows = items.map((row) => ({
    key: row.id,
    cells: [
      row.folio,
      [row.nombre, row.apellidoPaterno, row.apellidoMaterno].filter(Boolean).join(" "),
      <span
        key="estatus"
        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[row.estatus]}`}
      >
        {row.estatus}
      </span>,
      row.fechaAlta,
    ],
  }));

  const selectedAsociado = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ListaTabla
          headers={HEADERS}
          rows={rows}
          onRowClick={setSelectedIndex}
        />
        <div className="flex justify-center p-5">
          <Button
            variant="secondary"
            onClick={loadMore}
            disabled={!nextCursor || loading || loadingMore}
          >
            {loadingMore ? "Cargando…" : "Cargar más datos"}
          </Button>
        </div>
      </div>

      {selectedAsociado != null && selectedIndex != null && (
        <ModalAsociado
          asociado={selectedAsociado}
          onClose={() => setSelectedIndex(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedIndex(selectedIndex - 1) : undefined}
          onNext={selectedIndex < items.length - 1 ? () => setSelectedIndex(selectedIndex + 1) : undefined}
          onSave={(next) => {
            if (selectedIndex === null) return;
            onUpdateAsociado?.(selectedIndex, next);
          }}
        />
      )}
    </>
  );
}
