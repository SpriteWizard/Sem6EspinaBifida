"use client";

import { useState } from "react";

import FiltrosUsuarios from "../components/FiltrosUsuarios";
import ListaUsuarios from "../components/ListaUsuarios";

interface Filters {
  id: number | null;
  nombre: string;
  fecha: string;
  estatus: string;
}

export default function UsuariosPage() {
  const [filtros, setFiltros] = useState<Filters>({
    id: 0,
    nombre: "",
    fecha: "",
    estatus: "",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
        Usuarios
      </h1>

      <FiltrosUsuarios sendFilters={setFiltros} />

      <ListaUsuarios filtros={filtros} />
    </div>
  );
}
