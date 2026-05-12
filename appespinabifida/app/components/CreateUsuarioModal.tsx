"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";

type CreateUsuarioModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  nombre: string;
  email: string;
  password: string;
  role: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin_tabla", label: "Admin tabla" },
  { value: "secretaria", label: "Secretaria" },
];

const initialFormState: FormState = {
  nombre: "",
  email: "",
  password: "",
  role: "secretaria",
};

export default function CreateUsuarioModal({ open, onClose, onSuccess }: CreateUsuarioModalProps) {
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
    const nextErrors: FieldErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es requerido.";
    if (!form.email.trim()) nextErrors.email = "El correo es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Ingresa un correo válido.";
    if (!form.password.trim()) nextErrors.password = "La contraseña es requerida.";
    else if (form.password.length < 6) nextErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    if (!form.role.trim()) nextErrors.role = "Selecciona un rol.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/usuarios/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "ok") {
        setSubmitError(data.reason || "No se pudo crear el usuario.");
        setSubmitting(false);
        return;
      }

      onSuccess();
    } catch (error) {
      setSubmitError("Error al crear el usuario. Intenta nuevamente.");
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="create-user-modal" title="Crear nuevo usuario">
      <div className="space-y-4 px-5 py-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <Input
            type="text"
            value={form.nombre}
            onChange={(e) => updateField("nombre", e.target.value)}
            placeholder="Nombre completo"
          />
          {errors.nombre && <p className="mt-1 text-sm text-rose-700">{errors.nombre}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="usuario@gmail.com"
          />
          {errors.email && <p className="mt-1 text-sm text-rose-700">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Contraseña segura"
          />
          {errors.password && <p className="mt-1 text-sm text-rose-700">{errors.password}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
          <Select value={form.role} onChange={(e) => updateField("role", e.target.value)}>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          {errors.role && <p className="mt-1 text-sm text-rose-700">{errors.role}</p>}
        </div>

        {submitError && <p className="text-sm text-rose-700">{submitError}</p>}

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
