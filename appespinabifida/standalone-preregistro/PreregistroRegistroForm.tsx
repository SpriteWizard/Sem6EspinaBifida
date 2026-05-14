"use client";

import { useState, type FormEvent } from "react";

import type { PreregistroRegistroPayload } from "./types";
import { emptyPreregistroPayload } from "./types";
import { Button } from "@/components/ui/Button";

const inputClass =
  "h-10 w-full rounded-[12px] bg-white px-3.5 text-sm text-[#2B2B2B] placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD3EA]";

const selectClass =
  "h-10 w-full appearance-none rounded-[12px] bg-white px-3.5 pr-9 text-sm text-[#2B2B2B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD3EA]";

const labelClass =
  "mb-1 block text-[13px] font-semibold tracking-tight text-white";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-400">{message}</p>;
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
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  function set<K extends keyof PreregistroRegistroPayload>(key: K, v: PreregistroRegistroPayload[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setDoneMsg(null);
  }

  function validate(): boolean {
    const e: Partial<Record<keyof PreregistroRegistroPayload, string>> = {};
    const req = (key: keyof PreregistroRegistroPayload, label: string) => {
      if (!String(values[key]).trim()) e[key] = `${label} es obligatorio`;
    };

    req("nombre", "El nombre");
    req("apellidoPaterno", "El apellido paterno");
    req("apellidoMaterno", "El apellido materno");
    req("fechaNacimiento", "La fecha de nacimiento");
    req("sexo", "El sexo");
    req("curp", "El CURP");
    req("telefono", "El teléfono");
    req("direccionCalleNumero", "La calle y número");
    req("direccionCiudad", "La ciudad");
    req("direccionEstado", "El estado");
    req("direccionCp", "El CP");
    req("contactoEmergenciaRelacion", "El contacto de emergencia");
    req("madreNombre", "El nombre de la madre o tutora");
    req("madreApellidoPaterno", "El apellido paterno de la madre o tutora");
    req("madreApellidoMaterno", "El apellido materno de la madre o tutora");
    req("padreNombre", "El nombre del padre o tutor");
    req("padreApellidoPaterno", "El apellido paterno del padre o tutor");
    req("padreApellidoMaterno", "El apellido materno del padre o tutor");
    req("antecedentesMedicos", "Los antecedentes médicos");

    const curp = values.curp.trim().toUpperCase();
    if (values.curp.trim() && curp.length !== 18) {
      e.curp = "El CURP debe tener 18 caracteres";
    }
    if (
      (values.contactoEmergenciaRelacion === "Madre" || values.contactoEmergenciaRelacion === "Padre") &&
      !values.contactoEmergenciaTelefono.trim()
    ) {
      e.contactoEmergenciaTelefono = "El teléfono del contacto de emergencia es obligatorio";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setDoneMsg(null);
    if (!validate()) return;

    const payload: PreregistroRegistroPayload = {
      ...values,
      curp: values.curp.trim().toUpperCase(),
      nombre: values.nombre.trim(),
      apellidoPaterno: values.apellidoPaterno.trim(),
      apellidoMaterno: values.apellidoMaterno.trim(),
      direccionCalleNumero: values.direccionCalleNumero.trim(),
      direccionCiudad: values.direccionCiudad.trim(),
      direccionEstado: values.direccionEstado.trim(),
      direccionCp: values.direccionCp.trim(),
      contactoEmergenciaRelacion: values.contactoEmergenciaRelacion.trim(),
      contactoEmergenciaTelefono:
        values.contactoEmergenciaRelacion === "Madre" || values.contactoEmergenciaRelacion === "Padre"
          ? values.contactoEmergenciaTelefono.trim()
          : "",
      madreNombre: values.madreNombre.trim(),
      madreApellidoPaterno: values.madreApellidoPaterno.trim(),
      madreApellidoMaterno: values.madreApellidoMaterno.trim(),
      padreNombre: values.padreNombre.trim(),
      padreApellidoPaterno: values.padreApellidoPaterno.trim(),
      padreApellidoMaterno: values.padreApellidoMaterno.trim(),
    };

    setSending(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
        setDoneMsg("Solicitud enviada correctamente.");
      } else {
        console.log("[preregistro]", payload);
        setDoneMsg("Solicitud registrada en consola (conecta onSubmit a tu API).");
      }
      setValues(emptyPreregistroPayload());
    } catch (err) {
      setDoneMsg(err instanceof Error ? err.message : "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen w-full px-4 py-8 sm:px-8">
      <section className="mx-auto w-full max-w-5xl rounded-[20px] bg-slate-600 px-6 py-7 text-[#ECEDEF] shadow-[0_20px_45px_rgba(18,45,76,0.26)] sm:px-10 sm:py-9">
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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

            <div className="md:col-span-2">
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

            <div className="relative md:col-span-2">
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

            <div className="md:col-span-4">
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

            <div className="md:col-span-4">
              <label className={labelClass} htmlFor="pr-tel">Teléfono</label>
              <input
                id="pr-tel"
                type="tel"
                className={inputClass}
                value={values.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                autoComplete="tel"
                placeholder="Ej. 55 1234 5678"
              />
              <FieldError message={errors.telefono} />
            </div>
          </div>


          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-500/35 p-4">
              <p className="mb-3 text-sm font-semibold text-white/90">Madre o tutora</p>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="pr-m-nombre">Nombre</label>
                  <input
                    id="pr-m-nombre"
                    className={inputClass}
                    value={values.madreNombre}
                    onChange={(e) => set("madreNombre", e.target.value)}
                    placeholder="Nombre"
                  />
                  <FieldError message={errors.madreNombre} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pr-m-apellidopaterno">Apellido paterno</label>
                  <input
                    id="pr-m-apellidopaterno"
                    className={inputClass}
                    value={values.madreApellidoPaterno}
                    onChange={(e) => set("madreApellidoPaterno", e.target.value)}
                    placeholder="Apellido paterno"
                  />
                  <FieldError message={errors.madreApellidoPaterno} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pr-m-apellidomaterno">Apellido materno</label>
                  <input
                    id="pr-m-apellidomaterno"
                    className={inputClass}
                    value={values.madreApellidoMaterno}
                    onChange={(e) => set("madreApellidoMaterno", e.target.value)}
                    placeholder="Apellido materno"
                  />
                  <FieldError message={errors.madreApellidoMaterno} />
                </div>

              </div>
            </div>

            <div className="rounded-2xl bg-slate-500/35 p-4">
              <p className="mb-3 text-sm font-semibold text-white/90">Padre o tutor</p>
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="pr-p-nombre">Nombre</label>
                  <input
                    id="pr-p-nombre"
                    className={inputClass}
                    value={values.padreNombre}
                    onChange={(e) => set("padreNombre", e.target.value)}
                    placeholder="Nombre"
                  />
                  <FieldError message={errors.padreNombre} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pr-p-apellidopaterno">Apellido paterno</label>
                  <input
                    id="pr-p-apellidopaterno"
                    className={inputClass}
                    value={values.padreApellidoPaterno}
                    onChange={(e) => set("padreApellidoPaterno", e.target.value)}
                    placeholder="Apellido paterno"
                  />
                  <FieldError message={errors.padreApellidoPaterno} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pr-p-apellidomaterno">Apellido materno</label>
                  <input
                    id="pr-p-apellidomaterno"
                    className={inputClass}
                    value={values.padreApellidoMaterno}
                    onChange={(e) => set("padreApellidoMaterno", e.target.value)}
                    placeholder="Apellido materno"
                  />
                  <FieldError message={errors.padreApellidoMaterno} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-500/35 p-4">
            <p className="mb-3 text-sm font-semibold text-white/90">Contacto de emergencia</p>
            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
              <div className="relative">
                <label className={labelClass} htmlFor="pr-ce-relacion">Relación</label>
                <select
                  id="pr-ce-relacion"
                  className={selectClass}
                  value={values.contactoEmergenciaRelacion}
                  onChange={(e) => {
                    const relation = e.target.value;
                    set("contactoEmergenciaRelacion", relation);
                    if (relation !== "Madre" && relation !== "Padre") {
                      set("contactoEmergenciaTelefono", "");
                    }
                  }}
                >
                  <option value="">Selecciona…</option>
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Otro">Otro</option>
                </select>
                <FieldError message={errors.contactoEmergenciaRelacion} />
              </div>

    

              {values.contactoEmergenciaRelacion === "Madre" || values.contactoEmergenciaRelacion === "Padre" ? (
                <div>
                  <label className={labelClass} htmlFor="pr-ce-tel">Teléfono del contacto</label>
                  <input
                    id="pr-ce-tel"
                    type="tel"
                    className={inputClass}
                    value={values.contactoEmergenciaTelefono}
                    onChange={(e) => set("contactoEmergenciaTelefono", e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                  />
                  <FieldError message={errors.contactoEmergenciaTelefono} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-500/35 p-4">
            <p className="mb-3 text-sm font-semibold text-white/90">Dirección</p>
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
                <FieldError message={errors.direccionCalleNumero} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} htmlFor="pr-dir-cp">CP</label>
                <input
                  id="pr-dir-cp"
                  className={inputClass}
                  value={values.direccionCp}
                  onChange={(e) => set("direccionCp", e.target.value)}
                  placeholder="CP"
                />
                <FieldError message={errors.direccionCp} />
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
                <FieldError message={errors.direccionCiudad} />
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
                <FieldError message={errors.direccionEstado} />
              </div>
            </div>
          </div>
          
          <div>
            <label className={labelClass} htmlFor="pr-med">Antecedentes médicos</label>
            <textarea
              id="pr-med"
              rows={3}
              className="w-full rounded-[12px] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] placeholder:text-gray-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD3EA]"
              value={values.antecedentesMedicos}
              onChange={(e) => set("antecedentesMedicos", e.target.value)}
              placeholder="Diagnósticos relevantes, hospital de referencia, válvula, etc."
            />
            <FieldError message={errors.antecedentesMedicos} />
          </div>

          {doneMsg ? (
            <p
              className={`rounded-[12px] px-4 py-2.5 text-sm font-medium ${
                doneMsg.startsWith("No se pudo")
                  ? "bg-red-500/20 text-red-200"
                  : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              {doneMsg}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setValues(emptyPreregistroPayload());
                setErrors({});
                setDoneMsg(null);
              }}
            >
              Limpiar
            </Button>
            <Button type="submit" variant="secondary" disabled={sending}>
              {sending ? "Enviando…" : "Enviar preregistro"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
