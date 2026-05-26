"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";

type CreateMedicoModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  nombre: "",
  apellido: "",
  telefono: "",
  correo: "",
};

export default function CreateMedicoModal({ open, onClose, onSuccess }: CreateMedicoModalProps) {
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
    if (!form.apellido.trim()) next.apellido = "El apellido es requerido.";
    if (!form.telefono.trim()) next.telefono = "El teléfono es requerido.";
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.telefono))
      next.telefono = "Ingresa un teléfono válido.";
    if (!form.correo.trim()) next.correo = "El correo es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      next.correo = "Ingresa un correo válido.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/medicos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok") {
        const reason = data.reason ?? "No se pudo registrar el médico.";
        if (reason.toLowerCase().includes("correo") || reason.toLowerCase().includes("duplicado") || reason.toLowerCase().includes("unique")) {
          setErrors((prev) => ({ ...prev, correo: "Este correo ya está registrado." }));
        } else {
          setSubmitError(reason);
        }
        setSubmitting(false);
        return;
      }

      onSuccess();
    } catch {
      setSubmitError("Error al registrar el médico. Intenta nuevamente.");
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="create-medico-modal" title="Registrar médico">
      <div className="space-y-4 px-5 py-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
          <Input
            type="text"
            value={form.nombre}
            onChange={(e) => updateField("nombre", e.target.value)}
            placeholder="Nombre(s)"
          />
          {errors.nombre && <p className="mt-1 text-sm text-rose-700">{errors.nombre}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Apellido *</label>
          <Input
            type="text"
            value={form.apellido}
            onChange={(e) => updateField("apellido", e.target.value)}
            placeholder="Apellidos"
          />
          {errors.apellido && <p className="mt-1 text-sm text-rose-700">{errors.apellido}</p>}
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Correo *</label>
          <Input
            type="email"
            value={form.correo}
            onChange={(e) => updateField("correo", e.target.value)}
            placeholder="medico@ejemplo.com"
          />
          {errors.correo && <p className="mt-1 text-sm text-rose-700">{errors.correo}</p>}
        </div>

        {submitError && <p className="text-sm text-rose-700">{submitError}</p>}

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar médico"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
