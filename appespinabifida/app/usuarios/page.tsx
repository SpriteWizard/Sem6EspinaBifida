"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "../components/ui/Button";
import CreateUsuarioModal from "../components/CreateUsuarioModal";
import FiltrosUsuarios from "../components/FiltrosUsuarios";
import ListaUsuarios from "../components/ListaUsuarios";

interface Filters {
  id: number | null;
  nombre: string;
  fecha: string;
  estatus: string;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canCreate = role === "superadmin";

  const [filtros, setFiltros] = useState<Filters>({
    id: 0,
    nombre: "",
    fecha: "",
    estatus: "",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
          Usuarios
        </h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            + Nuevo usuario
          </Button>
        )}
      </div>

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
    </div>
  );
}
