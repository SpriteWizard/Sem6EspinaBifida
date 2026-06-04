"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";
import { PadecimientoSelector } from "./PadecimientoSelector";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import type { AsociadoDetalle } from "./ModalAsociado";

type Sexo = "Masculino" | "Femenino";

type FormState = {
  fechaAlta: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  fechaNacimiento: string;
  edad: string;
  sexo: Sexo;
  nombrePadreMadre: string;
  etapaVida: string;
  vive: "si" | "no";
  direccion: string;
  ciudad: string;
  estado: string;
  cp: string;
  telCasa: string;
  telTrabajo: string;
  telCel: string;
  correo: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoRelacion: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  fotoUrl: string;
  lugarNacimiento: string;
  hospital: string;
  padecimiento: string;
  tipoSangre: string;
  valvula: "si" | "no";
  controlUrologico: "si" | "no";
  lugarControlUrologico: string;
  fechaGralOrina: string;
  fechaEcoRenal: string;
  fechaEstUrodinamico: string;
  fechaTacCerebro: string;
  fechaUrocultivo: string;
  fechaUroTac: string;
  fechaUltEstUro: string;
  fechaOtrosEstudios: string;
  madreLugarNacimiento: string;
  madreEscolaridad: string;
  madreEdad: string;
  madreOcupacion: string;
  madreParentescoConPareja: "si" | "no";
  madreCdInicioEmbarazo: string;
  madreAcidoFolicoAntesDuranteEmbarazo: "si" | "no";
  madreCantidadCitasControlPrenatal: string;
  madreSeguro: string;
  padreLugarNacimiento: string;
  padreEscolaridad: string;
  padreEdad: string;
  padreOcupacion: string;
  padreParentescoConPareja: "si" | "no";
  padreSeguro: string;
  adiccionesAmbos: string;
  otroHijoConDTN: "si" | "no";
  familiarConDTN: "si" | "no";
  exposicionToxicosEmbarazo: "si" | "no";
  descripcionToxinas: string;
  foto: any;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const TITLE_ID = "create-asociado-modal-title";
const TABS = ["Datos generales", "Historial", "Historial padres"] as const;
type TabName = (typeof TABS)[number];

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila de Zaragoza",
  "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "Michoacán de Ocampo", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo",
  "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas",
  "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas", "Fuera del país",
];

const TIPOS_SANGRE = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

const ESCOLARIDADES = [
  "Sin escolaridad", "Primaria incompleta", "Primaria completa",
  "Secundaria incompleta", "Secundaria completa", "Preparatoria/Bachillerato",
  "Carrera técnica", "Licenciatura", "Posgrado",
];

function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

function oneYearFromToday(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

function calcularEdad(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  let birthDate: Date;
  if (fechaNacimiento.includes("-")) {
    birthDate = new Date(fechaNacimiento + "T00:00:00");
  } else if (fechaNacimiento.includes("/")) {
    const [d, m, y] = fechaNacimiento.split("/");
    birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  } else {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const dm = today.getMonth() - birthDate.getMonth();
  if (dm < 0 || (dm === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function etapaVidaDesdeEdad(edad: number | null): string {
  if (edad === null) return "";
  if (edad <= 2)  return "Primera infancia";
  if (edad <= 5)  return "Preescolar";
  if (edad <= 11) return "Edad escolar";
  if (edad <= 17) return "Adolescencia";
  if (edad <= 29) return "Adulto joven";
  if (edad <= 59) return "Adulto";
  return "Adulto mayor";
}

function initialForm(): FormState {
  return {
    fechaAlta: today(),
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    curp: "",
    fechaNacimiento: "",
    edad: "",
    sexo: "Femenino",
    nombrePadreMadre: "",
    etapaVida: "",
    vive: "si",
    direccion: "",
    ciudad: "",
    estado: "",
    cp: "",
    telCasa: "",
    telTrabajo: "",
    telCel: "",
    correo: "",
    contactoNombre: "",
    contactoTelefono: "",
    contactoRelacion: "",
    vigenciaDesde: today(),
    vigenciaHasta: oneYearFromToday(),
    fotoUrl: "",
    lugarNacimiento: "",
    hospital: "",
    padecimiento: "",
    tipoSangre: "",
    valvula: "no",
    controlUrologico: "no",
    lugarControlUrologico: "",
    fechaGralOrina: "",
    fechaEcoRenal: "",
    fechaEstUrodinamico: "",
    fechaTacCerebro: "",
    fechaUrocultivo: "",
    fechaUroTac: "",
    fechaUltEstUro: "",
    fechaOtrosEstudios: "",
    madreLugarNacimiento: "",
    madreEscolaridad: "",
    madreEdad: "",
    madreOcupacion: "",
    madreParentescoConPareja: "no",
    madreCdInicioEmbarazo: "",
    madreAcidoFolicoAntesDuranteEmbarazo: "no",
    madreCantidadCitasControlPrenatal: "",
    madreSeguro: "",
    padreLugarNacimiento: "",
    padreEscolaridad: "",
    padreEdad: "",
    padreOcupacion: "",
    padreParentescoConPareja: "no",
    padreSeguro: "",
    adiccionesAmbos: "",
    otroHijoConDTN: "no",
    familiarConDTN: "no",
    exposicionToxicosEmbarazo: "no",
    descripcionToxinas: "",
    foto: null,
  };
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-1 text-sm text-rose-700">{text}</p>;
}

function FormDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-xs font-bold uppercase tracking-widest text-[#003c64]">{label}</span>
      <div className="h-px flex-1 bg-[#003c64]/15" />
    </div>
  );
}

function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-14 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-800">Asociado creado correctamente</p>
        <p className="mt-1 text-sm text-slate-500">El registro fue guardado exitosamente.</p>
      </div>
      <Button variant="secondary" onClick={onClose}>Cerrar</Button>
    </div>
  );
}

export default function CreateAsociadoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Datos generales");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setErrors({});
    setSubmitting(false);
    setSubmitError(null);
    setActiveTab("Datos generales");
    setSuccess(false);
  }, [open]);

  // Calcular edad y etapa de vida automáticamente desde la fecha de nacimiento
  useEffect(() => {
    const edad = calcularEdad(form.fechaNacimiento);
    setForm((prev) => ({
      ...prev,
      edad: edad !== null ? String(edad) : "",
      etapaVida: etapaVidaDesdeEdad(edad),
    }));
  }, [form.fechaNacimiento]);

  // Vigencia hasta = 1 año después de vigencia desde
  useEffect(() => {
    if (!form.vigenciaDesde) return;
    const d = new Date(form.vigenciaDesde + "T00:00:00");
    d.setFullYear(d.getFullYear() + 1);
    update("vigenciaHasta", d.toISOString().split("T")[0]);
  }, [form.vigenciaDesde]);

  const emergencyComplete = useMemo(
    () =>
      form.contactoNombre.trim() &&
      form.contactoTelefono.trim() &&
      form.contactoRelacion.trim(),
    [form.contactoNombre, form.contactoRelacion, form.contactoTelefono],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Parentesco se pregunta una sola vez y aplica a ambos padres
  function updateParentesco(value: "si" | "no") {
    setForm((prev) => ({
      ...prev,
      madreParentescoConPareja: value,
      padreParentescoConPareja: value,
    }));
  }

  function validate() {
    const next: FieldErrors = {};

    // Datos generales
    if (!form.fechaAlta) next.fechaAlta = "La fecha de alta es requerida.";
    if (!form.nombre.trim()) next.nombre = "El nombre es requerido.";
    if (!form.apellidoPaterno.trim()) next.apellidoPaterno = "El apellido paterno es requerido.";
    if (!form.apellidoMaterno.trim()) next.apellidoMaterno = "El apellido materno es requerido.";
    if (!form.sexo) next.sexo = "Selecciona sexo.";
    if (!form.curp.trim()) next.curp = "El CURP es requerido.";
    else if (form.curp.trim().length !== 18) next.curp = "El CURP debe tener exactamente 18 caracteres.";
    if (!form.fechaNacimiento) next.fechaNacimiento = "La fecha de nacimiento es requerida.";
    if (!form.nombrePadreMadre.trim()) next.nombrePadreMadre = "El nombre del padre/madre o tutor es requerido.";
    if (!form.direccion.trim()) next.direccion = "La dirección es requerida.";
    if (!form.ciudad.trim()) next.ciudad = "La ciudad es requerida.";
    if (form.cp && !/^\d{5}$/.test(form.cp)) next.cp = "El CP debe tener exactamente 5 dígitos.";
    if (!form.correo.trim()) next.correo = "El correo es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) next.correo = "Correo inválido.";
    if (!form.vigenciaDesde) next.vigenciaDesde = "La vigencia desde es requerida.";

    // Teléfonos
    const phoneRegex = /^[0-9+\s]+$/;
    if (!form.telCasa.trim()) next.telCasa = "El teléfono de casa es requerido.";
    else if (!phoneRegex.test(form.telCasa)) next.telCasa = "Solo dígitos y +.";
    if (form.telTrabajo && !phoneRegex.test(form.telTrabajo)) next.telTrabajo = "Solo dígitos y +.";
    if (form.telCel && !phoneRegex.test(form.telCel)) next.telCel = "Solo dígitos y +.";

    // Emergencia
    if (!emergencyComplete) next.contactoNombre = "Completa los datos de emergencia.";

    // Historial
    if (!form.lugarNacimiento.trim()) next.lugarNacimiento = "El lugar de nacimiento es requerido.";
    if (!form.hospital.trim()) next.hospital = "El hospital es requerido.";
    if (!form.padecimiento.trim()) next.padecimiento = "El padecimiento es requerido.";
    if (!form.tipoSangre) next.tipoSangre = "El tipo de sangre es requerido.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => { img.src = reader.result as string; };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const SIZE = 200;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const x = (SIZE - img.width * scale) / 2;
      const y = (SIZE - img.height * scale) / 2;
      ctx?.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * scale, img.height * scale);
      update("foto", canvas.toDataURL("image/jpeg"));
      update("fotoUrl", URL.createObjectURL(file));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body = {
        ...form,
        apellidos: `${form.apellidoPaterno} ${form.apellidoMaterno}`.trim(),
        estatus: "Activo",
      };
      const res = await fetch("/api/asociados/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setSuccess(true);
      } else if (data.reason === "curp_duplicado") {
        setErrors((prev) => ({ ...prev, curp: "Este CURP ya está registrado en otro asociado." }));
        setActiveTab("Datos generales");
      } else {
        setSubmitError("No se pudo crear el asociado. Intenta de nuevo.");
      }
    } catch {
      setSubmitError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSuccessClose() {
    onClose();
    window.location.reload();
  }

  return (
    <Modal
      open={open}
      titleId={TITLE_ID}
      title="Crear asociado"
      onClose={onClose}
      className="max-w-5xl"
    >
      {success ? (
        <SuccessScreen onClose={handleSuccessClose} />
      ) : (
        <form onSubmit={handleSubmit} className="max-h-[78vh] overflow-y-auto px-5 pb-5 pt-4">
          <div className="mb-5 flex gap-1 border-b border-slate-100 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-slate-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {activeTab === "Datos generales" && (
              <>
                <FormDivider label="Alta y membresía" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <FieldLabel required>Fecha de alta</FieldLabel>
                    <Input type="date" value={form.fechaAlta} onChange={(e) => update("fechaAlta", e.target.value)} />
                    <ErrorText text={errors.fechaAlta} />
                  </div>
                  <div>
                    <FieldLabel required>Vigencia desde</FieldLabel>
                    <Input type="date" value={form.vigenciaDesde} onChange={(e) => update("vigenciaDesde", e.target.value)} />
                    <ErrorText text={errors.vigenciaDesde} />
                  </div>
                  <div>
                    <FieldLabel>Vigencia hasta</FieldLabel>
                    <Input type="date" value={form.vigenciaHasta} onChange={(e) => update("vigenciaHasta", e.target.value)} />
                  </div>
                </div>

                <FormDivider label="Identidad" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <FieldLabel required>Nombre</FieldLabel>
                    <Input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
                    <ErrorText text={errors.nombre} />
                  </div>
                  <div>
                    <FieldLabel required>Apellido paterno</FieldLabel>
                    <Input value={form.apellidoPaterno} onChange={(e) => update("apellidoPaterno", e.target.value)} />
                    <ErrorText text={errors.apellidoPaterno} />
                  </div>
                  <div>
                    <FieldLabel required>Apellido materno</FieldLabel>
                    <Input value={form.apellidoMaterno} onChange={(e) => update("apellidoMaterno", e.target.value)} />
                    <ErrorText text={errors.apellidoMaterno} />
                  </div>
                  <div>
                    <FieldLabel required>CURP</FieldLabel>
                    <Input value={form.curp} onChange={(e) => update("curp", e.target.value.toUpperCase())} maxLength={18} />
                    <ErrorText text={errors.curp} />
                  </div>
                  <div>
                    <FieldLabel required>Fecha de nacimiento</FieldLabel>
                    <Input type="date" value={form.fechaNacimiento} onChange={(e) => update("fechaNacimiento", e.target.value)} />
                    <ErrorText text={errors.fechaNacimiento} />
                  </div>
                  <div>
                    <FieldLabel>Edad / Etapa de vida</FieldLabel>
                    <Input
                      value={form.edad ? `${form.edad} años — ${form.etapaVida}` : ""}
                      readOnly disabled
                      placeholder="Se calcula desde la fecha de nacimiento"
                      className="bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <FieldLabel required>Sexo</FieldLabel>
                    <Select value={form.sexo} onChange={(e) => update("sexo", e.target.value as Sexo)}>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>¿El asociado está vivo?</FieldLabel>
                    <Select value={form.vive} onChange={(e) => update("vive", e.target.value as "si" | "no")}>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </div>
                </div>

                <FormDivider label="Padre / Madre o tutor" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Nombre</FieldLabel>
                    <Input value={form.nombrePadreMadre} onChange={(e) => update("nombrePadreMadre", e.target.value)} />
                    <ErrorText text={errors.nombrePadreMadre} />
                  </div>
                </div>

                <FormDivider label="Dirección" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel required>Calle y número</FieldLabel>
                    <Input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} />
                    <ErrorText text={errors.direccion} />
                  </div>
                  <div>
                    <FieldLabel required>Ciudad</FieldLabel>
                    <Input value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} />
                    <ErrorText text={errors.ciudad} />
                  </div>
                  <div>
                    <FieldLabel>Estado</FieldLabel>
                    <Select value={form.estado} onChange={(e) => update("estado", e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {ESTADOS_MEXICO.map((est) => (
                        <option key={est} value={est.toLowerCase()}>{est}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>CP</FieldLabel>
                    <Input
                      value={form.cp}
                      onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 5); update("cp", val); }}
                      inputMode="numeric" maxLength={5} placeholder="5 dígitos"
                    />
                    <ErrorText text={errors.cp} />
                  </div>
                </div>

                <FormDivider label="Contacto" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Teléfono casa</FieldLabel>
                    <Input value={form.telCasa} onChange={(e) => update("telCasa", e.target.value)} />
                    <ErrorText text={errors.telCasa} />
                  </div>
                  <div>
                    <FieldLabel>Teléfono trabajo</FieldLabel>
                    <Input value={form.telTrabajo} onChange={(e) => update("telTrabajo", e.target.value)} />
                    <ErrorText text={errors.telTrabajo} />
                  </div>
                  <div>
                    <FieldLabel>Teléfono celular</FieldLabel>
                    <Input value={form.telCel} onChange={(e) => update("telCel", e.target.value)} />
                    <ErrorText text={errors.telCel} />
                  </div>
                  <div>
                    <FieldLabel required>Correo electrónico</FieldLabel>
                    <Input type="email" value={form.correo} onChange={(e) => update("correo", e.target.value)} />
                    <ErrorText text={errors.correo} />
                  </div>
                </div>

                <FormDivider label="Emergencia" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel required>Avisar a</FieldLabel>
                    <Input value={form.contactoNombre} onChange={(e) => update("contactoNombre", e.target.value)} />
                    <ErrorText text={errors.contactoNombre} />
                  </div>
                  <div>
                    <FieldLabel required>Teléfono de aviso</FieldLabel>
                    <Input value={form.contactoTelefono} onChange={(e) => update("contactoTelefono", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel required>Relación</FieldLabel>
                    <Input value={form.contactoRelacion} onChange={(e) => update("contactoRelacion", e.target.value)} />
                  </div>
                </div>

                <FormDivider label="Foto" />
                <div className="space-y-2">
                  <Input type="file" accept="image/*" onChange={handlePhotoChange} />
                  {form.fotoUrl ? (
                    <img src={form.fotoUrl} alt="Vista previa" className="h-28 w-28 rounded-xl border border-slate-200 object-cover" />
                  ) : null}
                </div>
              </>
            )}

            {activeTab === "Historial" && (
              <>
                <FormDivider label="Nacimiento" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Lugar de nacimiento</FieldLabel>
                    <Input value={form.lugarNacimiento} onChange={(e) => update("lugarNacimiento", e.target.value)} />
                    <ErrorText text={errors.lugarNacimiento} />
                  </div>
                  <div>
                    <FieldLabel required>Hospital</FieldLabel>
                    <Input value={form.hospital} onChange={(e) => update("hospital", e.target.value)} />
                    <ErrorText text={errors.hospital} />
                  </div>
                </div>

                <FormDivider label="Padecimiento" />
                <div>
                  <FieldLabel required>Padecimiento</FieldLabel>
                  <PadecimientoSelector value={form.padecimiento} onChange={(v) => update("padecimiento", v)} />
                  <ErrorText text={errors.padecimiento} />
                </div>

                <FormDivider label="Estado de salud" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Tipo de sangre</FieldLabel>
                    <Select value={form.tipoSangre} onChange={(e) => update("tipoSangre", e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {TIPOS_SANGRE.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                    <ErrorText text={errors.tipoSangre} />
                  </div>
                  <div>
                    <FieldLabel>¿Válvula?</FieldLabel>
                    <Select value={form.valvula} onChange={(e) => update("valvula", e.target.value as "si" | "no")}>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Control urológico</FieldLabel>
                    <Select value={form.controlUrologico} onChange={(e) => update("controlUrologico", e.target.value as "si" | "no")}>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Lugar control urológico</FieldLabel>
                    <Input value={form.lugarControlUrologico} onChange={(e) => update("lugarControlUrologico", e.target.value)} />
                  </div>
                </div>

                <FormDivider label="Últimos estudios" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <FieldLabel>Gral. orina</FieldLabel>
                    <Input type="date" value={form.fechaGralOrina} onChange={(e) => update("fechaGralOrina", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Eco renal</FieldLabel>
                    <Input type="date" value={form.fechaEcoRenal} onChange={(e) => update("fechaEcoRenal", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Est. urodinámico</FieldLabel>
                    <Input type="date" value={form.fechaEstUrodinamico} onChange={(e) => update("fechaEstUrodinamico", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>TAC cerebro</FieldLabel>
                    <Input type="date" value={form.fechaTacCerebro} onChange={(e) => update("fechaTacCerebro", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Urocultivo</FieldLabel>
                    <Input type="date" value={form.fechaUrocultivo} onChange={(e) => update("fechaUrocultivo", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>UroTAC</FieldLabel>
                    <Input type="date" value={form.fechaUroTac} onChange={(e) => update("fechaUroTac", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Últ. est. uro.</FieldLabel>
                    <Input type="date" value={form.fechaUltEstUro} onChange={(e) => update("fechaUltEstUro", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Otros estudios</FieldLabel>
                    <Input type="date" value={form.fechaOtrosEstudios} onChange={(e) => update("fechaOtrosEstudios", e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {activeTab === "Historial padres" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-4">
                  <FormDivider label="Historial madre" />
                  <div>
                    <FieldLabel>Lugar nacimiento</FieldLabel>
                    <Input value={form.madreLugarNacimiento} onChange={(e) => update("madreLugarNacimiento", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Escolaridad</FieldLabel>
                    <Select value={form.madreEscolaridad} onChange={(e) => update("madreEscolaridad", e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {ESCOLARIDADES.map((esc) => <option key={esc} value={esc}>{esc}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Edad</FieldLabel>
                    <Input value={form.madreEdad} onChange={(e) => update("madreEdad", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Ocupación</FieldLabel>
                    <Input value={form.madreOcupacion} onChange={(e) => update("madreOcupacion", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Cd. inicio embarazo</FieldLabel>
                    <Input value={form.madreCdInicioEmbarazo} onChange={(e) => update("madreCdInicioEmbarazo", e.target.value)} />
                  </div>
                  <Select
                    value={form.madreAcidoFolicoAntesDuranteEmbarazo}
                    onChange={(e) => update("madreAcidoFolicoAntesDuranteEmbarazo", e.target.value as "si" | "no")}
                  >
                    <option value="no">Ácido fólico: No</option>
                    <option value="si">Ácido fólico: Sí</option>
                  </Select>
                  <div>
                    <FieldLabel>Citas control prenatal</FieldLabel>
                    <Input value={form.madreCantidadCitasControlPrenatal} onChange={(e) => update("madreCantidadCitasControlPrenatal", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Seguro</FieldLabel>
                    <Input value={form.madreSeguro} onChange={(e) => update("madreSeguro", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <FormDivider label="Historial padre" />
                  <div>
                    <FieldLabel>Lugar nacimiento</FieldLabel>
                    <Input value={form.padreLugarNacimiento} onChange={(e) => update("padreLugarNacimiento", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Escolaridad</FieldLabel>
                    <Select value={form.padreEscolaridad} onChange={(e) => update("padreEscolaridad", e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {ESCOLARIDADES.map((esc) => <option key={esc} value={esc}>{esc}</option>)}
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Edad</FieldLabel>
                    <Input value={form.padreEdad} onChange={(e) => update("padreEdad", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Ocupación</FieldLabel>
                    <Input value={form.padreOcupacion} onChange={(e) => update("padreOcupacion", e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Seguro</FieldLabel>
                    <Input value={form.padreSeguro} onChange={(e) => update("padreSeguro", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <FormDivider label="Historial ambos" />
                  <div>
                    <FieldLabel>¿Parentesco entre la pareja?</FieldLabel>
                    <Select
                      value={form.madreParentescoConPareja}
                      onChange={(e) => updateParentesco(e.target.value as "si" | "no")}
                    >
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Adicciones"
                    value={form.adiccionesAmbos}
                    onChange={(e) => update("adiccionesAmbos", e.target.value)}
                    rows={3}
                  />
                  <Select
                    value={form.otroHijoConDTN}
                    onChange={(e) => update("otroHijoConDTN", e.target.value as "si" | "no")}
                  >
                    <option value="no">Otro hijo con DTN: No</option>
                    <option value="si">Otro hijo con DTN: Sí</option>
                  </Select>
                  <Select
                    value={form.familiarConDTN}
                    onChange={(e) => update("familiarConDTN", e.target.value as "si" | "no")}
                  >
                    <option value="no">Familiar con DTN: No</option>
                    <option value="si">Familiar con DTN: Sí</option>
                  </Select>
                  <Select
                    value={form.exposicionToxicosEmbarazo}
                    onChange={(e) => {
                      const val = e.target.value as "si" | "no";
                      update("exposicionToxicosEmbarazo", val);
                      if (val === "no") update("descripcionToxinas", "");
                    }}
                  >
                    <option value="no">Exposición a tóxicos: No</option>
                    <option value="si">Exposición a tóxicos: Sí</option>
                  </Select>
                  <Textarea
                    placeholder="Descripción toxinas"
                    value={form.descripcionToxinas}
                    onChange={(e) => update("descripcionToxinas", e.target.value)}
                    rows={4}
                    disabled={form.exposicionToxicosEmbarazo !== "si"}
                  />
                </div>
              </div>
            )}

            {submitError ? (
              <p className="text-sm text-rose-700" role="alert">{submitError}</p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
            <p className="mr-auto self-center text-xs text-slate-400">
              <span className="text-rose-500">*</span> Campo requerido
            </p>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar asociado"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
