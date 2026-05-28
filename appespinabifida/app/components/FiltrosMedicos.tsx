"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

export type FiltrosMedicosValues = {
  id: number | null;
  nombre: string;
  estatus: string;
};

type FilterProps = {
  sendFilters: (filters: FiltrosMedicosValues) => void;
};

export default function FiltrosMedicos({ sendFilters }: FilterProps) {
  const [id, setId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [estatus, setEstatus] = useState("Activo");

  useEffect(() => {
    sendFilters({ id, nombre, estatus });
  }, [id, nombre, estatus, sendFilters]);

  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/70">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="number"
            placeholder="ID"
            value={id ?? ""}
            onChange={(e) => setId(e.target.value ? Number(e.target.value) : null)}
            aria-label="Buscar por ID"
            className="pl-9"
          />
        </div>

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

        <div className="relative">
          <Select
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
            aria-label="Filtrar por estatus"
          >
            <option value="">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </Select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▼</span>
        </div>
      </div>
    </div>
  );
}
