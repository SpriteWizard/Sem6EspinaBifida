"use client";

import { useEffect, useMemo, useState } from "react";
import ListaTabla from "./ListaTabla";
import ModalUsuario, { type UsuarioDetalle } from "./ModalUsuario";
import { Button } from "./ui/Button";

type Estatus = "Activo" | "Inactivo" | "Pendiente";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-red-500/10 text-red-500",
  Pendiente: "bg-yellow-600/10 text-yellow-600",
};

const HEADERS = ["ID", "Nombre", "Correo", "Estatus", "Fecha de alta", "Último acceso"];

type Filters = {
  id: number | null;
  nombre: string;
  fecha: string;
  estatus: string;
};

type ListaUsuariosProps = {
  filtros: Filters;
  refreshKey?: number;
};

export default function ListaUsuarios({ filtros, refreshKey }: ListaUsuariosProps) {
  const USUARIOS_PAGE_SIZE = 5;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [data, setData] = useState<UsuarioDetalle[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(
    () => `${refreshKey ?? 0}__${filtros.id ?? ""}__${filtros.nombre}__${filtros.fecha}__${filtros.estatus}`,
    [refreshKey, filtros.id, filtros.nombre, filtros.fecha, filtros.estatus],
  );

  function buildParams(cursor: string | null) {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(USUARIOS_PAGE_SIZE));
    if (filtros.id && filtros.id !== 0) params.set("id", String(filtros.id));
    if (filtros.nombre) params.set("nombre", filtros.nombre);
    if (filtros.fecha) params.set("fecha", filtros.fecha);
    if (filtros.estatus) params.set("estatus", filtros.estatus);
    return params;
  }

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      const params = buildParams(null);
      const res = await fetch(`/api/usuarios/lista?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        const users: UsuarioDetalle[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : payload.res === "Success"
          ? payload.usuarios
          : [];

        setData(users);
        setNextCursor(payload?.nextCursor ?? null);
        setSelectedIndex(null);
      } else {
        setError("No se pudo cargar usuarios.");
      }
      setLoading(false);
    }

    loadUsers();
  }, [queryKey]);

  const getStatusLabel = (estatus: any) => {
    if (estatus == 1) return "Activo";
    if (estatus == 0) return "Inactivo";
    return String(estatus);
  };

  const rows = data.map((row) => ({
    key: String(row.id),
    cells: [
      row.id,
      `${row.nombre ?? ""}${row.apellidos ? ` ${row.apellidos}` : ""}`,
      row.email ?? "",
      <span key="estatus" className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[getStatusLabel(row.estatus) as Estatus]}`}>
        {getStatusLabel(row.estatus)}
      </span>,
      row.fechaalta ? String(row.fechaalta).split("T")[0] : "—",
      row.ultimoacceso ? String(row.ultimoacceso).split("T")[0] : "—",
    ],
  }));

  const selectedUsuario = selectedIndex !== null && selectedIndex < data.length ? data[selectedIndex] : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        {error ? (
          <div className="px-4 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <ListaTabla headers={HEADERS} rows={rows} onRowClick={setSelectedIndex} />
        <div className="flex justify-center p-5">
          <Button
            variant="secondary"
            onClick={async () => {
              if (!nextCursor) return;
              setLoadingMore(true);
              try {
                const params = buildParams(nextCursor);
                const res = await fetch(`/api/usuarios/lista?${params.toString()}`);
                if (!res.ok) throw new Error();
                const payload = await res.json();
                const users: UsuarioDetalle[] = Array.isArray(payload?.items)
                  ? payload.items
                  : [];
                setData((prev) => [...prev, ...users]);
                setNextCursor(payload?.nextCursor ?? null);
              } catch {
                setError("No se pudo cargar más usuarios.");
              } finally {
                setLoadingMore(false);
              }
            }}
            disabled={!nextCursor || loading || loadingMore}
          >
            {loadingMore ? "Cargando..." : "Cargar más datos"}
          </Button>
        </div>
      </div>

      {selectedUsuario && selectedIndex !== null && (
        <ModalUsuario
          open={Boolean(selectedUsuario)}
          usuario={selectedUsuario}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
