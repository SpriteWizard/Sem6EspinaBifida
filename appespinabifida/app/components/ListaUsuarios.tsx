"use client";

import { useEffect, useState } from "react";
import ListaTabla from "./ListaTabla";
import ModalUsuario, { type UsuarioDetalle } from "./ModalUsuario";

type Estatus = "Activo" | "Inactivo" | "Pendiente";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-red-500/10 text-red-500",
  Pendiente: "bg-yellow-600/10 text-yellow-600",
};

const HEADERS = ["ID", "Nombre", "Correo", "Estatus", "Último acceso"];

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rawData, setRawData] = useState<UsuarioDetalle[]>([]);
  const [data, setData] = useState<UsuarioDetalle[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/usuarios/lista");
      if (res.ok) {
        const data = await res.json();
        const users: UsuarioDetalle[] = Array.isArray(data)
          ? data
          : data.res === "Success"
          ? data.usuarios
          : [];

        setRawData(users);
        setData(users);
      }
    }

    loadUsers();
  }, [refreshKey]);

  useEffect(() => {
    const getStatusLabel = (estatus: any) => {
      if (estatus == 1) return "Activo";
      if (estatus == 0) return "Inactivo";
      return String(estatus);
    };

    setData(
      rawData.filter((element) => {
        const idFilter = filtros.id == null || filtros.id === 0
          ? true
          : String(element.id).includes(String(filtros.id));
        const nombreFilter =
          filtros.nombre === "" || String(element.nombre ?? "").toLowerCase().includes(filtros.nombre.toLowerCase());
        const fechaFilter = filtros.fecha === "" || String(element.fechaalta ?? "") === filtros.fecha;
        const statusFilter = filtros.estatus === "" || getStatusLabel(element.estatus) === filtros.estatus;
        return idFilter && nombreFilter && fechaFilter && statusFilter;
      }),
    );
  }, [filtros, rawData]);

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
      row.ultimoacceso ?? "",
    ],
  }));

  const selectedUsuario = selectedIndex !== null && selectedIndex < data.length ? data[selectedIndex] : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ListaTabla headers={HEADERS} rows={rows} onRowClick={setSelectedIndex} />
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
