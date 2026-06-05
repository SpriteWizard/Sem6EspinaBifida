"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListaTabla from "./ListaTabla";
import ModalPreregistro from "./ModalPreregistro";
import { Button } from "./ui/Button";
import { type FiltrosPreregistroValues } from "./FiltrosPreregistro";

export type EstatusPreregistro = "Pendiente" | "Anulado";

const badgeColors: Record<EstatusPreregistro, string> = {
  Pendiente: "bg-yellow-600/10 text-yellow-600",
  Anulado:   "bg-red-500/10 text-red-500",
};

export interface PreregistroDetalle {
  id: string;
  folio: string;
  nombre: string;
  fechaSolicitud: string;
  estatus: EstatusPreregistro;
  notaanulacion?: string;

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

  direccion?: string;
  ciudad?: string;
  estado?: string;
  cp?: string;

  lugarNacimiento?: string;
  hospital?: string;
  padecimiento?: string;
  tipoSangre?: string;
  valvula?: boolean;
}

const HEADERS = ["ID", "Nombre", "Fecha de solicitud", "Estatus"];

type ListaPreregistroProps = {
  filtros: FiltrosPreregistroValues;
};

export default function ListaPreregistro({ filtros }: ListaPreregistroProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const consumedRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [items, setItems] = useState<PreregistroDetalle[]>([]);
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

    fetch(`/api/asociados/preRegistro/lista?${params}`)
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

  useEffect(() => {
    const id = searchParams.get("preregistro");
    if (!id || consumedRef.current || items.length === 0) return;
    const idx = items.findIndex((p) => String(p.id) === id);
    if (idx !== -1) {
      consumedRef.current = true;
      setSelectedIndex(idx);
      router.replace("/asociados");
    }
  }, [items, searchParams]);

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
      const res = await fetch(`/api/asociados/preRegistro/lista?${params}`);
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

  const selectedPreregistro = selectedIndex !== null ? items[selectedIndex] : null;

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

      {selectedPreregistro !== null && selectedIndex !== null && (
        <ModalPreregistro
          preregistro={selectedPreregistro}
          onClose={() => setSelectedIndex(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedIndex(selectedIndex - 1) : undefined}
          onNext={selectedIndex < items.length - 1 ? () => setSelectedIndex(selectedIndex + 1) : undefined}
          onAceptar={async (id) => {
            await fetch("/api/asociados/preRegistro/aceptar", {
              method: "PUT",
              body: JSON.stringify({ id }),
            });
            setItems((prev) => prev.filter((p) => p.id !== id));
            setSelectedIndex(null);
          }}
          onAnular={async (id, nota) => {
            await fetch("/api/asociados/preRegistro/anular", {
              method: "PUT",
              body: JSON.stringify({ id, razon: nota }),
            });
            setItems((prev) =>
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
