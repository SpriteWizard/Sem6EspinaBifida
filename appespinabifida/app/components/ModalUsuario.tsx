"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";

type UsuarioDetalle = {
  id: string;
  nombre: string;
  apellidos?: string;
  email: string;
  rol: string;
  estatus: "Activo" | "Inactivo" | "Pendiente";
  fechaalta: string;
  ultimoacceso: string;
  telefono: string;
  empresa?: string;
  fecha_desactivado?: string | null;
};

type ModalUsuarioProps = {
  open: boolean;
  usuario: UsuarioDetalle;
  onClose: () => void;
};

export default function ModalUsuario({ open, usuario, onClose }: ModalUsuarioProps) {
  const base = useMemo(() => usuario, [usuario]);
  const [draft, setDraft] = useState<UsuarioDetalle>(base);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setDraft(base);
    setIsEditMode(false);
  }, [base]);
  const normalizedStatus = String(usuario.estatus).toLowerCase();
  const isActive = ["activo", "1", "true"].includes(normalizedStatus);
  const statusLabel = ["activo", "1", "true"].includes(normalizedStatus)
    ? "Activo"
    : ["inactivo", "0", "false"].includes(normalizedStatus)
    ? "Inactivo"
    : usuario.estatus;

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(base),
    [draft, base],
  );

  function updateDraft<K extends keyof UsuarioDetalle>(key: K, value: UsuarioDetalle[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const res = await fetch("/api/usuarios/editar", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "ok") {
        setIsEditMode(false);
        window.location.reload();
        return;
      }
    }

    window.alert("No se pudo guardar los cambios. Intenta nuevamente.");
  }

  async function toggleStatus() {
    await fetch("/api/usuarios/toggleUsuario", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: usuario.id,
        estatus: isActive ? 1 : 0,
      }),
    });

    window.location.reload();
  }

  return (
    <Modal open={open} onClose={onClose} titleId="usuario-modal-title" title={`Usuario: ${usuario.nombre}${usuario.apellidos ? ` ${usuario.apellidos}` : ''}`}>
      <div className="space-y-4 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">ID</p>
            <p className="text-sm font-medium text-slate-900">{usuario.id}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Correo</p>
            {isEditMode ? (
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => updateDraft("email", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium text-slate-900">{usuario.email}</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Nombre</p>
            {isEditMode ? (
              <Input
                type="text"
                value={draft.nombre}
                onChange={(e) => updateDraft("nombre", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium text-slate-900">{usuario.nombre}</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Apellidos</p>
            {isEditMode ? (
              <Input
                type="text"
                value={draft.apellidos ?? ""}
                onChange={(e) => updateDraft("apellidos", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium text-slate-900">{usuario.apellidos || "—"}</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Rol</p>
            {isEditMode ? (
              <Select
                value={draft.rol}
                onChange={(e) => updateDraft("rol", e.target.value)}
              >
                <option value="superadmin">Superadmin</option>
                <option value="admin_tabla">Admin tabla</option>
                <option value="secretaria">Secretaria</option>
              </Select>
            ) : (
              <p className="text-sm font-medium text-slate-900">{usuario.rol}</p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Estatus</p>
            <p className="text-sm font-medium text-slate-900">{statusLabel}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Fecha de alta</p>
            <p className="text-sm font-medium text-slate-900">{usuario.fechaalta}</p>
          </div>

          {usuario.fecha_desactivado != null && (
            <div>
              <p className="text-xs uppercase text-slate-500">Fecha de desactivación</p>
              <p className="text-sm font-medium text-slate-900">{usuario.fecha_desactivado}</p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase text-slate-500">Último acceso</p>
            <p className="text-sm font-medium text-slate-900">{usuario.ultimoacceso}</p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-slate-500">Teléfono</p>
            {isEditMode ? (
              <Input
                type="tel"
                value={draft.telefono}
                onChange={(e) => updateDraft("telefono", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium text-slate-900">{usuario.telefono}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-slate-500">Empresa</p>
            <p className="text-sm font-medium text-slate-900">Espina Bifida</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          {isEditMode ? (
            <Button variant="secondary" onClick={() => setIsEditMode(false)}>
              Cancelar
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditMode(true)}>
              Editar
            </Button>
          )}

          <Button
            variant={isEditMode ? "primary" : isActive ? "destructive" : "primary"}
            onClick={isEditMode ? handleSave : toggleStatus}
            disabled={isEditMode && !hasChanges}
          >
            {isEditMode ? "Guardar cambios" : isActive ? "Desactivar cuenta" : "Reactivar cuenta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { UsuarioDetalle };