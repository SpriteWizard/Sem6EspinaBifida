"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";

import type { PreregistroRegistroPayload } from "./types";
import { emptyPreregistroPayload } from "./types";
import { Button } from "@/components/ui/Button";

const inputClass =
  "h-10 w-full rounded-[12px] bg-white px-3.5 text-sm text-[#2B2B2B] placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD3EA]";

const selectClass =
  "h-10 w-full appearance-none rounded-[12px] bg-white px-3.5 pr-9 text-sm text-[#2B2B2B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD3EA]";

const labelClass =
  "mb-1 block text-[13px] font-semibold tracking-tight text-white";

// ─── INTEGRACIÓN BACKEND ─────────────────────────────────────────────────────
// Para conectar al API, pasa el prop 'onSubmit' al componente desde la página:
//   <PreregistroRegistroForm onSubmit={async (data) => {
//     await fetch("/api/preregistro", { method: "POST", body: JSON.stringify(data) });
//   }} />
//
// Mientras no haya backend, el último formulario enviado queda guardado en
// 'lastPreregistroJSON' (variable de módulo) y visible en la consola del navegador.
// ─────────────────────────────────────────────────────────────────────────────
export let lastPreregistroJSON: string | null = null;

function SectionTitle({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-3 text-sm font-semibold text-white/90">
      {children}
      {required && <span className="ml-1 text-rose-400">*</span>}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-400">{message}</p>;
}

function ConfirmModal({
  values,
  onCancel,
  onConfirm,
  sending,
}: {
  values: PreregistroRegistroPayload;
  onCancel: () => void;
  onConfirm: () => void;
  sending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-[20px] bg-[#003C64] px-7 py-7 shadow-[0_20px_45px_rgba(18,45,76,0.4)]">
        <h2 className="mb-1 text-lg font-semibold text-white">¿Tus datos son correctos?</h2>
        <p className="mb-5 text-sm text-white/60">
          Revisa que la información sea correcta antes de enviar.
        </p>

        <div className="mb-5 space-y-1 rounded-[12px] bg-white/10 px-4 py-3 text-sm text-white/90">
          <p><span className="font-semibold">Nombre:</span> {values.nombre} {values.apellidoPaterno} {values.apellidoMaterno}</p>
          <p><span className="font-semibold">Correo:</span> {values.correo}</p>
          <p><span className="font-semibold">Teléfono:</span> {values.telefono}</p>
          <p><span className="font-semibold">Padre/Madre:</span> {values.padresMadresNombre} {values.padresMadresApellidoPaterno} {values.padresMadresApellidoMaterno}</p>
          <p><span className="font-semibold">Contacto de emergencia:</span> {values.contactoEmergenciaNombre} ({values.contactoEmergenciaRelacion})</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[10px] px-5 py-2 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="rounded-[10px] bg-white px-5 py-2 text-sm font-semibold text-[#003C64] hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Confirmar y enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-[20px] bg-[#003C64] px-7 py-8 text-center shadow-[0_20px_45px_rgba(18,45,76,0.4)]">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20">
            <svg className="h-7 w-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">No se pudo enviar</h2>
        <p className="mb-6 text-sm text-white/70 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] bg-white px-6 py-2 text-sm font-semibold text-[#003C64] hover:bg-white/90 transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-[20px] bg-[#003C64] px-7 py-8 text-center shadow-[0_20px_45px_rgba(18,45,76,0.4)]">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">¡Preregistro enviado!</h2>
        <p className="mb-6 text-sm text-white/70 leading-relaxed">
          Se llenó el preregistro correctamente. Muchas gracias, nos pondremos en contacto con usted próximamente.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] bg-white px-6 py-2 text-sm font-semibold text-[#003C64] hover:bg-white/90 transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export type PreregistroRegistroFormProps = {
  onSubmit?: (data: PreregistroRegistroPayload) => void | Promise<void>;
  title?: string;
};

export function PreregistroRegistroForm({
  onSubmit,
  title = "Preregistro de asociado",
}: PreregistroRegistroFormProps) {
  const [values, setValues] = useState<PreregistroRegistroPayload>(emptyPreregistroPayload);
  const [errors, setErrors] = useState<Partial<Record<keyof PreregistroRegistroPayload, string>>>(
    {},
  );
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function set<K extends keyof PreregistroRegistroPayload>(key: K, v: PreregistroRegistroPayload[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof PreregistroRegistroPayload, string>> = {};
    const req = (key: keyof PreregistroRegistroPayload, label: string) => {
      if (!String(values[key]).trim()) e[key] = `${label} es obligatorio`;
    };

    // Datos generales (obligatorio)
    if (!values.correo.trim()) {
      e.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo.trim())) {
      e.correo = "Ingresa un correo válido";
    }
    req("nombre", "El nombre");
    req("apellidoPaterno", "El apellido paterno");
    req("apellidoMaterno", "El apellido materno");
    req("fechaNacimiento", "La fecha de nacimiento");
    req("sexo", "El sexo");
    req("curp", "El CURP");
    req("telefono", "El teléfono");

    const curp = values.curp.trim().toUpperCase();
    if (values.curp.trim() && curp.length !== 18) {
      e.curp = "El CURP debe tener 18 caracteres";
    }

    const phoneRegex = /^[0-9\s+\-()+]+$/;
    if (values.telefono.trim() && !phoneRegex.test(values.telefono.trim())) {
      e.telefono = "Solo dígitos, espacios, + y guiones";
    }

    if (values.direccionCp.trim() && !/^\d{5}$/.test(values.direccionCp.trim())) {
      e.direccionCp = "El CP debe tener exactamente 5 dígitos";
    }

    // Padre/Madre (obligatorio)
    req("padresMadresNombre", "El nombre del padre/madre o tutor");
    req("padresMadresApellidoPaterno", "El apellido paterno del padre/madre o tutor");
    req("padresMadresApellidoMaterno", "El apellido materno del padre/madre o tutor");

    // Contacto de emergencia (obligatorio)
    req("contactoEmergenciaNombre", "El nombre del contacto de emergencia");
    req("contactoEmergenciaTelefono", "El teléfono del contacto de emergencia");
    req("contactoEmergenciaRelacion", "La relación del contacto de emergencia");

    if (values.contactoEmergenciaTelefono.trim() && !phoneRegex.test(values.contactoEmergenciaTelefono.trim())) {
      e.contactoEmergenciaTelefono = "Solo dígitos, espacios, + y guiones";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmitClick(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirm() {
    const payload: PreregistroRegistroPayload = {
      ...values,
      correo: values.correo.trim(),
      curp: values.curp.trim().toUpperCase(),
      nombre: values.nombre.trim(),
      apellidoPaterno: values.apellidoPaterno.trim(),
      apellidoMaterno: values.apellidoMaterno.trim(),
      direccionCalleNumero: values.direccionCalleNumero.trim(),
      direccionCiudad: values.direccionCiudad.trim(),
      direccionEstado: values.direccionEstado.trim(),
      direccionCp: values.direccionCp.trim(),
      contactoEmergenciaNombre: values.contactoEmergenciaNombre.trim(),
      contactoEmergenciaTelefono: values.contactoEmergenciaTelefono.trim(),
      contactoEmergenciaRelacion: values.contactoEmergenciaRelacion.trim(),
      padresMadresNombre: values.padresMadresNombre.trim(),
      padresMadresApellidoPaterno: values.padresMadresApellidoPaterno.trim(),
      padresMadresApellidoMaterno: values.padresMadresApellidoMaterno.trim(),
      lugarNacimiento: values.lugarNacimiento.trim(),
      hospital: values.hospital.trim(),
    };

    setSending(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        lastPreregistroJSON = JSON.stringify(payload, null, 2);
      }
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      setShowConfirm(false);
      setSubmitError(err instanceof Error ? err.message : "No se pudo enviar el preregistro. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    setValues(emptyPreregistroPayload());
    setErrors({});
  }

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          values={values}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => void handleConfirm()}
          sending={sending}
        />
      )}
      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}
      {submitError && <ErrorModal message={submitError} onClose={() => setSubmitError(null)} />}

      <main className="min-h-screen w-full px-4 py-8 sm:px-8">
        <section className="mx-auto w-full max-w-5xl rounded-[20px] bg-slate-600 px-6 py-7 text-[#ECEDEF] shadow-[0_20px_45px_rgba(18,45,76,0.26)] sm:px-10 sm:py-9">

          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center justify-center rounded-2xl bg-white px-6 py-3 shadow-[0_8px_18px_rgba(9,24,44,0.16)]">
              <Image
                src="/LOGO-08.jpg"
                alt="Asociación de Espina Bífida"
                width={200}
                height={102}
                className="h-auto w-[200px]"
              />
            </div>
          </div>

          <header className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          </header>

          <form onSubmit={handleSubmitClick} className="space-y-4">

            {/* Datos generales * */}
            <div className="rounded-2xl bg-slate-500/35 p-4">
              <SectionTitle required>Datos generales</SectionTitle>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-12">

                <div className="md:col-span-4">
                  <label className={labelClass} htmlFor="pr-nombre">Nombre</label>
                  <input
                    id="pr-nombre"
                    className={inputClass}
                    value={values.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                    autoComplete="name"
                    placeholder="Nombre"
                  />
                  <FieldError message={errors.nombre} />
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass} htmlFor="pr-apellidopaterno">Apellido paterno</label>
                  <input
                    id="pr-apellidopaterno"
                    className={inputClass}
                    value={values.apellidoPaterno}
                    onChange={(e) => set("apellidoPaterno", e.target.value)}
                    autoComplete="name"
                    placeholder="Apellido paterno"
                  />
                  <FieldError message={errors.apellidoPaterno} />
                </div>

                <div className="md:col-span-4">
                  <label className={labelClass} htmlFor="pr-apellidomaterno">Apellido materno</label>
                  <input
                    id="pr-apellidomaterno"
                    className={inputClass}
                    value={values.apellidoMaterno}
                    onChange={(e) => set("apellidoMaterno", e.target.value)}
                    autoComplete="name"
                    placeholder="Apellido materno"
                  />
                  <FieldError message={errors.apellidoMaterno} />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass} htmlFor="pr-fnac">Fecha de nacimiento</label>
                  <input
                    id="pr-fnac"
                    type="date"
                    className={inputClass}
                    value={values.fechaNacimiento}
                    onChange={(e) => set("fechaNacimiento", e.target.value)}
                  />
                  <FieldError message={errors.fechaNacimiento} />
                </div>

                <div className="relative md:col-span-3">
                  <label className={labelClass} htmlFor="pr-sexo">Sexo</label>
                  <select
                    id="pr-sexo"
                    className={selectClass}
                    value={values.sexo}
                    onChange={(e) => set("sexo", e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro / prefiero no decir</option>
                  </select>
                  <FieldError message={errors.sexo} />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass} htmlFor="pr-curp">CURP</label>
                  <input
                    id="pr-curp"
                    className={inputClass}
                    value={values.curp}
                    onChange={(e) => set("curp", e.target.value.toUpperCase())}
                    maxLength={18}
                    autoComplete="off"
                    placeholder="18 caracteres"
                  />
                  <FieldError message={errors.curp} />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass} htmlFor="pr-tel">Teléfono de casa</label>
                  <input
                    id="pr-tel"
                    type="tel"
                    className={inputClass}
                    value={values.telefono}
                    onChange={(e) => set("telefono", e.target.value.replace(/[^\d\s+\-()]/g, ""))}
                    autoComplete="tel"
                    maxLength={15}
                    placeholder="Ej. 55 1234 5678"
                  />
                  <FieldError message={errors.telefono} />
                </div>

                <div className="md:col-span-12">
                  <label className={labelClass} htmlFor="pr-correo">Correo electrónico</label>
                  <input
                    id="pr-correo"
                    type="email"
                    className={inputClass}
                    value={values.correo}
                    onChange={(e) => set("correo", e.target.value)}
                    autoComplete="email"
                    placeholder="ejemplo@correo.com"
                  />
                  <FieldError message={errors.correo} />
                </div>

              </div>
            </div>

            {/* Padre/Madre o tutor * */}
            <div className="rounded-2xl bg-slate-500/35 p-4">
              <SectionTitle required>Padre/Madre o tutor</SectionTitle>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="pr-pm-nombre">Nombre</label>
                  <input
                    id="pr-pm-nombre"
                    className={inputClass}
                    value={values.padresMadresNombre}
                    onChange={(e) => set("padresMadresNombre", e.target.value)}
                    placeholder="Nombre"
                  />
                  <FieldError message={errors.padresMadresNombre} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pr-pm-apellidopaterno">Apellido paterno</label>
                  <input
                    id="pr-pm-apellidopaterno"
                    className={inputClass}
                    value={values.padresMadresApellidoPaterno}
                    onChange={(e) => set("padresMadresApellidoPaterno", e.target.value)}
                    placeholder="Apellido paterno"
                  />
                  <FieldError message={errors.padresMadresApellidoPaterno} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pr-pm-apellidomaterno">Apellido materno</label>
                  <input
                    id="pr-pm-apellidomaterno"
                    className={inputClass}
                    value={values.padresMadresApellidoMaterno}
                    onChange={(e) => set("padresMadresApellidoMaterno", e.target.value)}
                    placeholder="Apellido materno"
                  />
                  <FieldError message={errors.padresMadresApellidoMaterno} />
                </div>
              </div>
            </div>

            {/* Contacto de emergencia * */}
            <div className="rounded-2xl bg-slate-500/35 p-4">
              <SectionTitle required>Contacto de emergencia</SectionTitle>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="pr-ce-nombre">Avisar a</label>
                  <input
                    id="pr-ce-nombre"
                    className={inputClass}
                    value={values.contactoEmergenciaNombre}
                    onChange={(e) => set("contactoEmergenciaNombre", e.target.value)}
                    placeholder="Nombre completo"
                  />
                  <FieldError message={errors.contactoEmergenciaNombre} />
                </div>

                <div>
                  <label className={labelClass} htmlFor="pr-ce-tel">Teléfono</label>
                  <input
                    id="pr-ce-tel"
                    type="tel"
                    className={inputClass}
                    value={values.contactoEmergenciaTelefono}
                    onChange={(e) => set("contactoEmergenciaTelefono", e.target.value.replace(/[^\d\s+\-()]/g, ""))}
                    maxLength={15}
                    placeholder="Ej. 55 1234 5678"
                  />
                  <FieldError message={errors.contactoEmergenciaTelefono} />
                </div>

                <div className="relative">
                  <label className={labelClass} htmlFor="pr-ce-relacion">Relación</label>
                  <select
                    id="pr-ce-relacion"
                    className={selectClass}
                    value={values.contactoEmergenciaRelacion}
                    onChange={(e) => set("contactoEmergenciaRelacion", e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    <option value="Madre">Madre</option>
                    <option value="Padre">Padre</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <FieldError message={errors.contactoEmergenciaRelacion} />
                </div>
              </div>
            </div>

            {/* Dirección (opcional) */}
            <div className="rounded-2xl bg-slate-500/35 p-4">
              <SectionTitle>Dirección</SectionTitle>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-12">
                <div className="md:col-span-4">
                  <label className={labelClass} htmlFor="pr-dir-calle-num">Calle y número</label>
                  <input
                    id="pr-dir-calle-num"
                    className={inputClass}
                    value={values.direccionCalleNumero}
                    onChange={(e) => set("direccionCalleNumero", e.target.value)}
                    placeholder="Calle y número"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass} htmlFor="pr-dir-ciudad">Ciudad</label>
                  <input
                    id="pr-dir-ciudad"
                    className={inputClass}
                    value={values.direccionCiudad}
                    onChange={(e) => set("direccionCiudad", e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={labelClass} htmlFor="pr-dir-estado">Estado</label>
                  <input
                    id="pr-dir-estado"
                    className={inputClass}
                    value={values.direccionEstado}
                    onChange={(e) => set("direccionEstado", e.target.value)}
                    placeholder="Estado"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="pr-dir-cp">CP</label>
                  <input
                    id="pr-dir-cp"
                    className={inputClass}
                    value={values.direccionCp}
                    onChange={(e) => set("direccionCp", e.target.value.replace(/\D/g, ""))}
                    maxLength={5}
                    inputMode="numeric"
                    placeholder="CP"
                  />
                  <FieldError message={errors.direccionCp} />
                </div>
              </div>
            </div>

            {/* Historial médico (opcional) */}
            <div className="rounded-2xl bg-slate-500/35 p-4">
              <SectionTitle>Historial médico</SectionTitle>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">

                <div>
                  <label className={labelClass} htmlFor="pr-lugar-nac">Lugar de nacimiento</label>
                  <input
                    id="pr-lugar-nac"
                    className={inputClass}
                    value={values.lugarNacimiento}
                    onChange={(e) => set("lugarNacimiento", e.target.value)}
                    placeholder="Ciudad, Estado"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="pr-hospital">Hospital</label>
                  <input
                    id="pr-hospital"
                    className={inputClass}
                    value={values.hospital}
                    onChange={(e) => set("hospital", e.target.value)}
                    placeholder="Hospital de referencia"
                  />
                </div>

                <div>
                  <label className={labelClass}>¿Válvula?</label>
                  <div className="flex items-center gap-5 h-10">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                      <input
                        type="radio"
                        name="pr-valvula"
                        value="Sí"
                        checked={values.valvula === "Sí"}
                        onChange={() => set("valvula", "Sí")}
                        onClick={() => values.valvula === "Sí" && set("valvula", "")}
                        className="accent-[#BFD3EA] h-4 w-4"
                      />
                      Sí
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
                      <input
                        type="radio"
                        name="pr-valvula"
                        value="No"
                        checked={values.valvula === "No"}
                        onChange={() => set("valvula", "No")}
                        onClick={() => values.valvula === "No" && set("valvula", "")}
                        className="accent-[#BFD3EA] h-4 w-4"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <label className={labelClass} htmlFor="pr-sangre">Sangre (tipo)</label>
                  <select
                    id="pr-sangre"
                    className={selectClass}
                    value={values.tipoSangre}
                    onChange={(e) => set("tipoSangre", e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="pr-med">Padecimientos</label>
                  <textarea
                    id="pr-med"
                    rows={3}
                    className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] placeholder:text-gray-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD3EA]"
                    value={values.antecedentesMedicos}
                    onChange={(e) => set("antecedentesMedicos", e.target.value)}
                    placeholder="Ejemplo: Mielomeningocele, Microcefalia, Medula Anclada, etc."
                  />
                </div>

              </div>
            </div>

            {/* Leyenda */}
            <p className="text-xs text-white/50 px-1">
              <span className="text-rose-400">*</span> Sección obligatoria · Las secciones sin asterisco son opcionales.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setValues(emptyPreregistroPayload());
                  setErrors({});
                }}
              >
                Limpiar
              </Button>
              <Button type="submit" variant="secondary">
                Enviar preregistro
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
