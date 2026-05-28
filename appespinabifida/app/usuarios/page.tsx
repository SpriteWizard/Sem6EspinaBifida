"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";

import { Button } from "../components/ui/Button";
import CreateUsuarioModal from "../components/CreateUsuarioModal";
import FiltrosUsuarios from "../components/FiltrosUsuarios";
import ListaUsuarios from "../components/ListaUsuarios";
import FiltrosMedicos, { type FiltrosMedicosValues } from "../components/FiltrosMedicos";
import ListaMedicos from "../components/ListaMedicos";
import CreateMedicoModal from "../components/CreateMedicoModal";
import FiltrosLaboratorios, { type FiltrosLaboratoriosValues } from "../components/FiltrosLaboratorios";
import ListaLaboratorios from "../components/ListaLaboratorios";
import CreateLaboratorioModal from "../components/CreateLaboratorioModal";

type Tab = "usuarios" | "medicos" | "laboratorios";

interface FiltrosUsuario {
  id: number | null;
  nombre: string;
  fecha: string;
  estatus: string;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canCreate = role === "superadmin";

  const [activeTab, setActiveTab] = useState<Tab>("usuarios");

  // Estado tab Usuarios
  const [filtros, setFiltros] = useState<FiltrosUsuario>({
    id: 0,
    nombre: "",
    fecha: "",
    estatus: "Activo",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado tab Médicos
  const [filtrosMedicos, setFiltrosMedicos] = useState<FiltrosMedicosValues>({
    id: null,
    nombre: "",
    estatus: "Activo",
  });
  const [createMedicoOpen, setCreateMedicoOpen] = useState(false);
  const [refreshMedicoKey, setRefreshMedicoKey] = useState(0);

  // Estado tab Laboratorios
  const [filtrosLaboratorios, setFiltrosLaboratorios] = useState<FiltrosLaboratoriosValues>({
    id: null,
    nombre: "",
    estatus: "Activo",
  });
  const [createLaboratorioOpen, setCreateLaboratorioOpen] = useState(false);
  const [refreshLaboratorioKey, setRefreshLaboratorioKey] = useState(0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "usuarios", label: "Usuarios" },
    { key: "medicos", label: "Médicos" },
    { key: "laboratorios", label: "Laboratorios" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
        Gestión
      </h1>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "usuarios" && canCreate && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo usuario
          </Button>
        )}

        {activeTab === "medicos" && canCreate && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateMedicoOpen(true)}
          >
            Registrar médico
          </Button>
        )}

        {activeTab === "laboratorios" && canCreate && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateLaboratorioOpen(true)}
          >
            Registrar laboratorio
          </Button>
        )}
      </div>

      {activeTab === "usuarios" && (
        <>
          <FiltrosUsuarios sendFilters={setFiltros} />
          <ListaUsuarios filtros={filtros} refreshKey={refreshKey} />
          <CreateUsuarioModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSuccess={() => {
              setCreateOpen(false);
              setRefreshKey((prev) => prev + 1);
            }}
          />
        </>
      )}

      {activeTab === "medicos" && (
        <>
          <FiltrosMedicos sendFilters={setFiltrosMedicos} />
          <ListaMedicos filtros={filtrosMedicos} refreshKey={refreshMedicoKey} onSuccess={() => setRefreshMedicoKey((prev) => prev + 1)} />
          <CreateMedicoModal
            open={createMedicoOpen}
            onClose={() => setCreateMedicoOpen(false)}
            onSuccess={() => {
              setCreateMedicoOpen(false);
              setRefreshMedicoKey((prev) => prev + 1);
            }}
          />
        </>
      )}

      {activeTab === "laboratorios" && (
        <>
          <FiltrosLaboratorios sendFilters={setFiltrosLaboratorios} />
          <ListaLaboratorios filtros={filtrosLaboratorios} refreshKey={refreshLaboratorioKey} onSuccess={() => setRefreshLaboratorioKey((prev) => prev + 1)} />
          <CreateLaboratorioModal
            open={createLaboratorioOpen}
            onClose={() => setCreateLaboratorioOpen(false)}
            onSuccess={() => {
              setCreateLaboratorioOpen(false);
              setRefreshLaboratorioKey((prev) => prev + 1);
            }}
          />
        </>
      )}
    </div>
  );
}
