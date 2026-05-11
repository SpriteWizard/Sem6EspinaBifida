"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

type FilterProps = {
  sendFilters: Function;
};

export default function FiltrosUsuarios({ sendFilters }: FilterProps) {
  const [id, setId] = useState<number | null>(null);
  const [nombre, setNombre] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [estatus, setEstatus] = useState<string>("");

  function applyFilters() {
    sendFilters({ id, nombre, fecha, estatus });
  }

  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 items-start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="number"
            placeholder="ID"
            onChange={(e) => setId(Number(e.target.value))}
            aria-label="Buscar por ID"
            className="pl-9"
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Nombre"
            onChange={(e) => setNombre(e.target.value)}
            aria-label="Buscar por nombre"
            className="pl-9"
          />
        </div>

        <div>
          <Input
            type="date"
            onChange={(e) => setFecha(e.target.value)}
            aria-label="Filtrar por fecha de alta"
          />
          <span className="mt-1 block text-xs text-slate-500">Fecha de alta</span>
        </div>

        <div className="relative">
          <Select
            onChange={(e) => setEstatus(e.target.value)}
            aria-label="Filtrar por estatus"
          >
            <option value="">Todos los estatus</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Pendiente">Pendiente</option>
          </Select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▼</span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="secondary" onClick={applyFilters}>
          Buscar
        </Button>
      </div>
    </div>
  );
}
