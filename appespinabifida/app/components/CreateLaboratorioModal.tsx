"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";

type CreateLaboratorioModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  sitio_web: string;
  nombre_contacto: string;
  horario_atencion: string;
};

type FieldErrors = Partial<Record<"nombre" | "direccion" | "telefono" | "correo", string>>;

const initialFormState: FormState = {
  nombre: "",
  direccion: "",
  telefono: "",
  correo: "",
  sitio_web: "",
  nombre_contacto: "",
  horario_atencion: "",
};

export default function CreateLaboratorioModal({ open, onClose, onSuccess }: CreateLaboratorioModalProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initialFormState);
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
  }, [open]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!form.nombre.trim()) next.nombre = "El nombre es requerido.";
    if (!form.direccion.trim()) next.direccion = "La dirección es requerida.";
    if (!form.telefono.trim()) next.telefono = "El teléfono es requerido.";
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.telefono))
      next.telefono = "Ingresa un teléfono válido.";
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      next.correo = "Ingresa un correo válido.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/laboratorios/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok") {
        const reason = data.reason ?? "No se pudo registrar el laboratorio.";
        if (
          reason.toLowerCase().includes("nombre") ||
          reason.toLowerCase().includes("duplicado") ||
          reason.toLowerCase().includes("unique")
        ) {
          setErrors((prev) => ({ ...prev, nombre: "Este nombre ya está registrado." }));
        } else {
          setSubmitError(reason);
        }
        setSubmitting(false);
        return;
      }

      onSuccess();
    } catch {
      setSubmitError("Error al registrar el laboratorio. Intenta nuevamente.");
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="create-laboratorio-modal" title="Registrar laboratorio">
      <div className="space-y-4 px-5 py-4 max-h-[80vh] overflow-y-auto">
        {/* Campos requeridos */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
          <Input
            type="text"
            value={form.nombre}
            onChange={(e) => updateField("nombre", e.target.value)}
            placeholder="Nombre del laboratorio"
          />
          {errors.nombre && <p className="mt-1 text-sm text-rose-700">{errors.nombre}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dirección *</label>
          <Input
            type="text"
            value={form.direccion}
            onChange={(e) => updateField("direccion", e.target.value)}
            placeholder="Dirección completa"
          />
          {errors.direccion && <p className="mt-1 text-sm text-rose-700">{errors.direccion}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono *</label>
          <Input
            type="tel"
            value={form.telefono}
            onChange={(e) => updateField("telefono", e.target.value)}
            placeholder="81 1234 5678"
          />
          {errors.telefono && <p className="mt-1 text-sm text-rose-700">{errors.telefono}</p>}
        </div>

        {/* Información adicional */}
        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Información adicional
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
              <Input
                type="email"
                value={form.correo}
                onChange={(e) => updateField("correo", e.target.value)}
                placeholder="contacto@laboratorio.com"
              />
              {errors.correo && <p className="mt-1 text-sm text-rose-700">{errors.correo}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sitio web</label>
              <Input
                type="text"
                value={form.sitio_web}
                onChange={(e) => updateField("sitio_web", e.target.value)}
                placeholder="www.laboratorio.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre de contacto</label>
              <Input
                type="text"
                value={form.nombre_contacto}
                onChange={(e) => updateField("nombre_contacto", e.target.value)}
                placeholder="Nombre de la persona de contacto"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Horario de atención</label>
              <Input
                type="text"
                value={form.horario_atencion}
                onChange={(e) => updateField("horario_atencion", e.target.value)}
                placeholder="Lun–Vie 8:00–18:00"
              />
            </div>
          </div>
        </div>

        {submitError && <p className="text-sm text-rose-700">{submitError}</p>}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar laboratorio"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
