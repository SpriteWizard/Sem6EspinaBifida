"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";

export type MedicoDetalle = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  estatus: "Activo" | "Inactivo" | 1 | 0;
  fecha_alta: string;
  fecha_desactivacion?: string | null;
};

type ModalMedicoProps = {
  open: boolean;
  medico: MedicoDetalle;
  onClose: () => void;
};

function getStatusLabel(estatus: MedicoDetalle["estatus"]): "Activo" | "Inactivo" {
  if (estatus === 1 || estatus === "Activo") return "Activo";
  return "Inactivo";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return String(value).split("T")[0];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type FieldErrors = Partial<Record<"nombre" | "apellido" | "telefono" | "correo", string>>;

export default function ModalMedico({ open, medico, onClose }: ModalMedicoProps) {
  const base = useMemo(() => medico, [medico]);
  const [draft, setDraft] = useState<MedicoDetalle>(base);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(base);
    setIsEditMode(false);
    setErrors({});
    setSaveError(null);
  }, [base]);

  const statusLabel = getStatusLabel(medico.estatus);
  const isActive = statusLabel === "Activo";

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(base),
    [draft, base],
  );

  function updateDraft<K extends keyof MedicoDetalle>(key: K, value: MedicoDetalle[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!draft.nombre.trim()) next.nombre = "El nombre es requerido.";
    if (!draft.apellido.trim()) next.apellido = "El apellido es requerido.";
    if (!draft.telefono.trim()) next.telefono = "El teléfono es requerido.";
    if (!draft.correo.trim()) next.correo = "El correo es requerido.";
    else if (!isValidEmail(draft.correo)) next.correo = "Ingresa un correo válido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaveError(null);

    const res = await fetch("/api/medicos/editar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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

    setSaveError("No se pudo guardar los cambios. Intenta nuevamente.");
  }

  async function handleToggle() {
    if (isActive) {
      const confirmed = window.confirm(
        `¿Estás seguro de que deseas desactivar al médico ${medico.nombre} ${medico.apellido}?`,
      );
      if (!confirmed) return;
    }

    await fetch("/api/medicos/toggleMedico", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: medico.id, estatus: isActive ? 0 : 1 }),
    });

    window.location.reload();
  }

  const field = (
    label: string,
    key: "nombre" | "apellido" | "telefono" | "correo",
    type: string = "text",
    colSpan?: boolean,
  ) => (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      {isEditMode ? (
        <>
          <Input
            type={type}
            value={String(draft[key] ?? "")}
            onChange={(e) => updateDraft(key, e.target.value as any)}
          />
          {errors[key] && (
            <p className="mt-1 text-sm text-rose-700">{errors[key]}</p>
          )}
        </>
      ) : (
        <p className="text-sm font-medium text-slate-900">{String(medico[key] || "—")}</p>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="medico-modal-title"
      title={`Médico: ${medico.nombre} ${medico.apellido}`}
    >
      <div className="space-y-4 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">ID</p>
            <p className="text-sm font-medium text-slate-900">{medico.id}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Estatus</p>
            <span
              className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                isActive
                  ? "bg-green-600/10 text-green-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {field("Nombre", "nombre")}
          {field("Apellido", "apellido")}
          {field("Teléfono", "telefono", "tel")}
          {field("Correo", "correo", "email")}

          <div>
            <p className="text-xs uppercase text-slate-500">Fecha de alta</p>
            <p className="text-sm font-medium text-slate-900">{formatDate(medico.fecha_alta)}</p>
          </div>

          {medico.fecha_desactivacion != null && (
            <div>
              <p className="text-xs uppercase text-slate-500">Fecha de desactivación</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(medico.fecha_desactivacion)}</p>
            </div>
          )}
        </div>

        {saveError && <p className="text-sm text-rose-700">{saveError}</p>}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          {isEditMode ? (
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(base);
                setIsEditMode(false);
                setErrors({});
                setSaveError(null);
              }}
            >
              Cancelar
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditMode(true)}>
              Editar
            </Button>
          )}

          <Button
            variant={isEditMode ? "primary" : isActive ? "destructive" : "primary"}
            onClick={isEditMode ? handleSave : handleToggle}
            disabled={isEditMode && !hasChanges}
          >
            {isEditMode
              ? "Guardar cambios"
              : isActive
              ? "Desactivar médico"
              : "Reactivar médico"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
