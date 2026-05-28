"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";

export type LaboratorioDetalle = {
  id_laboratorio: number;
  nombre: string;
  direccion: string;
  telefono: string;
  correo?: string;
  sitio_web?: string;
  nombre_contacto?: string;
  horario_atencion?: string;
  estatus: "Activo" | "Inactivo" | 1 | 0;
  fecha_alta: string;
  fecha_desactivacion?: string | null;
};

type ModalLaboratorioProps = {
  open: boolean;
  laboratorio: LaboratorioDetalle;
  onClose: () => void;
  onSuccess: () => void;
};

function getStatusLabel(estatus: LaboratorioDetalle["estatus"]): "Activo" | "Inactivo" {
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

type FieldErrors = Partial<Record<"nombre" | "direccion" | "telefono" | "correo", string>>;

export default function ModalLaboratorio({ open, laboratorio, onClose, onSuccess }: ModalLaboratorioProps) {
  const base = useMemo(() => laboratorio, [laboratorio]);
  const [draft, setDraft] = useState<LaboratorioDetalle>(base);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(base);
    setIsEditMode(false);
    setErrors({});
    setSaveError(null);
  }, [base]);

  const statusLabel = getStatusLabel(laboratorio.estatus);
  const isActive = statusLabel === "Activo";

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(base),
    [draft, base],
  );

  function updateDraft<K extends keyof LaboratorioDetalle>(key: K, value: LaboratorioDetalle[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!draft.nombre.trim()) next.nombre = "El nombre es requerido.";
    if (!draft.direccion.trim()) next.direccion = "La dirección es requerida.";
    if (!draft.telefono.trim()) next.telefono = "El teléfono es requerido.";
    if (draft.correo && !isValidEmail(draft.correo))
      next.correo = "Ingresa un correo válido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaveError(null);

    const res = await fetch("/api/laboratorios/editar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "ok") {
        onClose();
        onSuccess();
        return;
      }
    }

    setSaveError("No se pudo guardar los cambios. Intenta nuevamente.");
  }

  async function handleToggle() {
    await fetch("/api/laboratorios/toggleLaboratorio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_laboratorio: laboratorio.id_laboratorio, estatus: isActive ? 0 : 1 }),
    });

    onClose();
    onSuccess();
  }

  function readonlyField(label: string, value?: string | null) {
    return (
      <div>
        <p className="text-xs uppercase text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || "—"}</p>
      </div>
    );
  }

  function editableField(
    label: string,
    key: keyof LaboratorioDetalle,
    type = "text",
    error?: string,
  ) {
    return (
      <div>
        <p className="text-xs uppercase text-slate-500">{label}</p>
        {isEditMode ? (
          <>
            <Input
              type={type}
              value={String(draft[key] ?? "")}
              onChange={(e) => updateDraft(key, e.target.value as any)}
            />
            {error && <p className="mt-1 text-sm text-rose-700">{error}</p>}
          </>
        ) : (
          <p className="text-sm font-medium text-slate-900">
            {String(laboratorio[key] || "—")}
          </p>
        )}
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="laboratorio-modal-title"
      title={`Laboratorio: ${laboratorio.nombre}`}
    >
      <div className="space-y-4 px-5 py-4">
        {/* Campos de solo lectura */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">ID</p>
            <p className="text-sm font-medium text-slate-900">LAB-{laboratorio.id_laboratorio}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-slate-500">Estatus</p>
            <span
              className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                isActive
                  ? "bg-green-600/10 text-green-600"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {readonlyField("Fecha de alta", formatDate(laboratorio.fecha_alta))}
          {laboratorio.fecha_desactivacion != null &&
            readonlyField("Fecha de desactivación", formatDate(laboratorio.fecha_desactivacion))}
        </div>

        <hr className="border-slate-100" />

        {/* Campos editables requeridos */}
        <div className="grid gap-4 sm:grid-cols-2">
          {editableField("Nombre *", "nombre", "text", errors.nombre)}
          {editableField("Teléfono *", "telefono", "tel", errors.telefono)}
          <div className="sm:col-span-2">
            {editableField("Dirección *", "direccion", "text", errors.direccion)}
          </div>
        </div>

        {/* Información adicional */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Información adicional
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {editableField("Correo", "correo", "email", errors.correo)}
            {editableField("Sitio web", "sitio_web")}
            {editableField("Nombre de contacto", "nombre_contacto")}
            {editableField("Horario de atención", "horario_atencion")}
          </div>
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
              ? "Desactivar laboratorio"
              : "Reactivar laboratorio"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
