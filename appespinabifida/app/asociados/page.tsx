"use client"

import { useState } from "react";
import { Plus } from "lucide-react";

import Filtros from "../components/Filtros";
import FiltrosPreregistro, { type FiltrosPreregistroValues } from "../components/FiltrosPreregistro";
import ListaAsociados from "../components/ListaAsociados";
import CreateAsociadoModal from "../components/CreateAsociadoModal";
import ListaPreregistro from "../components/ListaPreregistro";
import { Button } from "../components/ui/Button";

type Tab = "asociados" | "preregistro";

interface Filters {
  id: number | null,
  nombre: string,
  fecha: string,
  estatus: string
}

export default function Asociados() {
  const [activeTab, setActiveTab] = useState<Tab>("asociados");
  const [filtros, setFiltros] = useState<Filters>({
    id: 0,
    nombre: "",
    fecha: "",
    estatus: ""
  });
  const [filtrosPreregistro, setFiltrosPreregistro] = useState<FiltrosPreregistroValues>({
    id: null,
    nombre: "",
    fecha: "",
    estatus: "Pendiente"
  });
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
        Asociados
      </h1>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("asociados")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "asociados"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Asociados
          </button>
          <button
            onClick={() => setActiveTab("preregistro")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "preregistro"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Preregistro
          </button>
        </div>

        {activeTab === "asociados" && (
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Agregar asociado
          </Button>
        )}
      </div>

      {activeTab === "asociados" && (
        <>
          <Filtros sendFilters={setFiltros} />
          <ListaAsociados filtros={filtros} />
          <CreateAsociadoModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
        </>
      )}

      {activeTab === "preregistro" && (
        <>
          <FiltrosPreregistro sendFilters={setFiltrosPreregistro} />
          <ListaPreregistro filtros={filtrosPreregistro} />
        </>
      )}
    </div>
  );
}
