"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

type FilterProps = {
  sendFilters: Function;
}

export default function Filtros({ sendFilters }: FilterProps) {
  const [idStr, setIdStr] = useState<string>("");
  const [nombre, setNombre] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [estatus, setEstatus] = useState<string>("");

  const hasActiveFilters = idStr !== "" || nombre !== "" || fecha !== "" || estatus !== "";

  function clearFilters() {
    setIdStr("");
    setNombre("");
    setFecha("");
    setEstatus("");
  }

  useEffect(() => {
    sendFilters({ id: idStr ? Number(idStr) : null, nombre, fecha, estatus });
  }, [idStr, nombre, fecha, estatus]);

  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70">
      {hasActiveFilters && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-800"
          >
            Limpiar filtros
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 items-start">
        {/* ID */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="number"
            placeholder="ID"
            value={idStr}
            onChange={(e) => setIdStr(e.target.value)}
            aria-label="Buscar por ID"
            className="pl-9"
          />
        </div>

        {/* Nombre */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-label="Buscar por nombre"
            className="pl-9"
          />
        </div>

        {/* Fecha de alta */}
        <div>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            aria-label="Filtrar por fecha de alta"
          />
          <span className="mt-1 block text-xs text-slate-500">Fecha de alta</span>
        </div>

        {/* Estatus */}
        <div className="relative">
          <Select
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
            aria-label="Filtrar por estatus"
          >
            <option value="">Todos los estatus</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▼</span>
        </div>
      </div>
    </div>
  );
}
