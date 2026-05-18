"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";
import { PadecimientoSelector } from "./PadecimientoSelector";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import type { AsociadoDetalle } from "./ModalAsociado";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Sexo = "Masculino" | "Femenino";
type Estatus = "Activo" | "Inactivo" | "Pendiente";

type FormState = {
  id: string;
  fechaAlta: string;
  nombre: string;
  apellidos: string;
  curp: string;
  fechaNacimiento: string;
  edad: string;
  sexo: Sexo;
  estatus: Estatus;
  nombrePadreMadre: string;
  etapaVida: string;
  vive: "si" | "no";
  fechaUltRecibo: string;
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

function initialForm(): FormState {
  return {
    id: "",
    fechaAlta: "",
    nombre: "",
    apellidos: "",
    curp: "",
    fechaNacimiento: "",
    edad: "",
    sexo: "Femenino",
    estatus: "Activo",
    nombrePadreMadre: "",
    etapaVida: "",
    vive: "si",
    fechaUltRecibo: "",
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
    vigenciaDesde: "",
    vigenciaHasta: "",
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
    foto: null
  };
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-slate-700">{children}</label>;
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-1 text-sm text-rose-700">{text}</p>;
}

export default function CreateAsociadoModal({ open, onClose}: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Datos generales");

  async function agregarAsociado(){
    const res = await fetch("/api/asociados/agregar",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form)
    })
    if (res.ok){
      const data = await res.json();
      if (data.status = "ok"){
        alert("Se creo el asociado correctamente");
        window.location.reload();
      }
      else{
        alert(data.reason);
      }
    }
    else{
      alert("No se pudo conectar con el servicio de agregado de asociados");
    }
  }

  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setErrors({});
    setSubmitting(false);
    setSubmitError(null);
    setActiveTab("Datos generales");
  }, [open]);

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

  function validate() {
    const next: FieldErrors = {};
    if (!form.id.trim()) next.id = "El ID es requerido.";
    if (!form.fechaAlta) next.fechaAlta = "La fecha de alta es requerida.";
    if (!form.nombre.trim()) next.nombre = "El nombre es requerido.";
    if (!form.sexo) next.sexo = "Selecciona sexo.";
    if (!form.estatus) next.estatus = "Selecciona estatus.";
    if (!emergencyComplete) {
      next.contactoNombre = "Completa los datos de emergencia.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      img.src = reader.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const SIZE = 200;
      canvas.width = SIZE;
      canvas.height = SIZE;

      // Optional: keep aspect ratio (center crop)
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const x = (SIZE - img.width * scale) / 2;
      const y = (SIZE - img.height * scale) / 2;

      ctx?.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        x,
        y,
        img.width * scale,
        img.height * scale
      );

      const resizedBase64 = canvas.toDataURL("image/jpeg");

      const url = URL.createObjectURL(file);

      update("foto", resizedBase64);
      update("fotoUrl", url);
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const telefonos = [form.telCasa, form.telTrabajo, form.telCel].filter(Boolean);

      const asociado: AsociadoDetalle = {
        id: form.id.trim(),
        folio: form.id.trim(),
        nombre: form.nombre.trim(),
        fechaNacimiento: form.fechaNacimiento || "—",
        sexo: form.sexo,
        curp: form.curp.trim() || "—",
        direccion: form.direccion.trim() || "—",
        telefonos: telefonos.length ? telefonos : ["—"],
        contactoEmergencia: {
          nombre: form.contactoNombre.trim(),
          telefono: form.contactoTelefono.trim(),
          relacion: form.contactoRelacion.trim(),
        },
        fechaAlta: form.fechaAlta,
        estatus: form.estatus,
        edad: form.edad.trim() || "—",
        nombrePadreMadre: form.nombrePadreMadre.trim() || "—",
        etapaVida: form.etapaVida.trim() || "—",
        vive: form.vive === "si",
        fechaUltRecibo: form.fechaUltRecibo || "—",
        ciudad: form.ciudad.trim() || "—",
        estado: form.estado.trim() || "—",
        cp: form.cp.trim() || "—",
        telCasa: form.telCasa.trim() || "—",
        telTrabajo: form.telTrabajo.trim() || "—",
        telCel: form.telCel.trim() || "—",
        correo: form.correo.trim() || "—",
        vigenciaDesde: form.vigenciaDesde || "—",
        vigenciaHasta: form.vigenciaHasta || "—",
        fotoUrl: form.fotoUrl || undefined,
        lugarNacimiento: form.lugarNacimiento.trim() || "—",
        hospital: form.hospital.trim() || "—",
        padecimiento: form.padecimiento.trim() || "—",
        tipoSangre: form.tipoSangre.trim() || "—",
        valvula: form.valvula === "si",
        controlUrologico: form.controlUrologico === "si",
        lugarControlUrologico: form.lugarControlUrologico.trim() || "—",
        fechaGralOrina: form.fechaGralOrina || "—",
        fechaEcoRenal: form.fechaEcoRenal || "—",
        fechaEstUrodinamico: form.fechaEstUrodinamico || "—",
        fechaTacCerebro: form.fechaTacCerebro || "—",
        fechaUrocultivo: form.fechaUrocultivo || "—",
        fechaUroTac: form.fechaUroTac || "—",
        fechaUltEstUro: form.fechaUltEstUro || "—",
        fechaOtrosEstudios: form.fechaOtrosEstudios || "—",
        madreLugarNacimiento: form.madreLugarNacimiento.trim() || "—",
        madreEscolaridad: form.madreEscolaridad.trim() || "—",
        madreEdad: form.madreEdad.trim() || "—",
        madreOcupacion: form.madreOcupacion.trim() || "—",
        madreParentescoConPareja: form.madreParentescoConPareja === "si",
        madreCdInicioEmbarazo: form.madreCdInicioEmbarazo.trim() || "—",
        madreAcidoFolicoAntesDuranteEmbarazo:
          form.madreAcidoFolicoAntesDuranteEmbarazo === "si",
        madreCantidadCitasControlPrenatal:
          form.madreCantidadCitasControlPrenatal.trim() || "—",
        madreSeguro: form.madreSeguro.trim() || "—",
        padreLugarNacimiento: form.padreLugarNacimiento.trim() || "—",
        padreEscolaridad: form.padreEscolaridad.trim() || "—",
        padreEdad: form.padreEdad.trim() || "—",
        padreOcupacion: form.padreOcupacion.trim() || "—",
        padreParentescoConPareja: form.padreParentescoConPareja === "si",
        padreSeguro: form.padreSeguro.trim() || "—",
        adiccionesAmbos: form.adiccionesAmbos.trim() || "—",
        otroHijoConDTN: form.otroHijoConDTN === "si",
        familiarConDTN: form.familiarConDTN === "si",
        exposicionToxicosEmbarazo: form.exposicionToxicosEmbarazo === "si",
        descripcionToxinas: form.descripcionToxinas.trim() || "—",
      };

      
      agregarAsociado();
      onClose();
    } catch {
      setSubmitError("No se pudo crear el asociado. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      titleId={TITLE_ID}
      title="Crear asociado"
      onClose={onClose}
      className="max-w-5xl"
    >
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

        <div className="space-y-6">
          {activeTab === "Datos generales" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>Fecha de alta</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaAlta}
                    onChange={(e) => update("fechaAlta", e.target.value)}
                  />
                  <ErrorText text={errors.fechaAlta} />
                </div>
                <div>
                  <FieldLabel>Sexo</FieldLabel>
                  <Select
                    value={form.sexo}
                    onChange={(e) => update("sexo", e.target.value as Sexo)}
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Estatus</FieldLabel>
                  <Select
                    value={form.estatus}
                    onChange={(e) => update("estatus", e.target.value as Estatus)}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Pendiente">Pendiente</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Nombre</FieldLabel>
                  <Input
                    value={form.nombre}
                    onChange={(e) => update("nombre", e.target.value)}
                  />
                  <ErrorText text={errors.nombre} />
                </div>

                <div>
                  <FieldLabel>Apellidos</FieldLabel>
                  <Input
                    value={form.apellidos}
                    onChange={(e) => update("apellidos", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>CURP</FieldLabel>
                  <Input value={form.curp} onChange={(e) => update("curp", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Fecha de nacimiento</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(e) => update("fechaNacimiento", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Edad</FieldLabel>
                  <Input value={form.edad} onChange={(e) => update("edad", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Etapa de vida</FieldLabel>
                  <Input
                    value={form.etapaVida}
                    onChange={(e) => update("etapaVida", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Nombre padre / madre</FieldLabel>
                  <Input
                    value={form.nombrePadreMadre}
                    onChange={(e) => update("nombrePadreMadre", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>¿Vive?</FieldLabel>
                  <Select value={form.vive} onChange={(e) => update("vive", e.target.value as "si" | "no")}>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Fecha últ. recibo</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaUltRecibo}
                    onChange={(e) => update("fechaUltRecibo", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>Calle y número</FieldLabel>
                  <Input
                    value={form.direccion}
                    onChange={(e) => update("direccion", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Ciudad</FieldLabel>
                  <Input value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Estado</FieldLabel>
                  <Input value={form.estado} onChange={(e) => update("estado", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>CP</FieldLabel>
                  <Input value={form.cp} onChange={(e) => update("cp", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Teléfono casa</FieldLabel>
                  <Input value={form.telCasa} onChange={(e) => update("telCasa", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Teléfono trabajo</FieldLabel>
                  <Input
                    value={form.telTrabajo}
                    onChange={(e) => update("telTrabajo", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Teléfono celular</FieldLabel>
                  <Input value={form.telCel} onChange={(e) => update("telCel", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input value={form.correo} onChange={(e) => update("correo", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel>Avisar a</FieldLabel>
                  <Input
                    value={form.contactoNombre}
                    onChange={(e) => update("contactoNombre", e.target.value)}
                  />
                  <ErrorText text={errors.contactoNombre} />
                </div>
                <div>
                  <FieldLabel>Teléfono de aviso</FieldLabel>
                  <Input
                    value={form.contactoTelefono}
                    onChange={(e) => update("contactoTelefono", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Relación</FieldLabel>
                  <Input
                    value={form.contactoRelacion}
                    onChange={(e) => update("contactoRelacion", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Vigencia desde</FieldLabel>
                  <Input
                    type="date"
                    value={form.vigenciaDesde}
                    onChange={(e) => update("vigenciaDesde", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Vigencia hasta</FieldLabel>
                  <Input
                    type="date"
                    value={form.vigenciaHasta}
                    onChange={(e) => update("vigenciaHasta", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Foto</FieldLabel>
                <Input type="file" accept="image/*" onChange={handlePhotoChange} />
                {form.fotoUrl ? (
                  <img
                    src={form.fotoUrl}
                    alt="Vista previa"
                    className="h-28 w-28 rounded-xl border border-slate-200 object-cover"
                  />
                ) : null}
              </div>
            </>
          )}

          {activeTab === "Historial" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Lugar de nacimiento</FieldLabel>
                  <Input
                    value={form.lugarNacimiento}
                    onChange={(e) => update("lugarNacimiento", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Hospital</FieldLabel>
                  <Input value={form.hospital} onChange={(e) => update("hospital", e.target.value)} />
                </div>
              </div>

              <div>
                <FieldLabel>Padecimiento</FieldLabel>
                <PadecimientoSelector
                  value={form.padecimiento}
                  onChange={(v) => update("padecimiento", v)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Tipo de sangre</FieldLabel>
                  <Input
                    value={form.tipoSangre}
                    onChange={(e) => update("tipoSangre", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>¿Válvula?</FieldLabel>
                  <Select
                    value={form.valvula}
                    onChange={(e) => update("valvula", e.target.value as "si" | "no")}
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Control urológico</FieldLabel>
                  <Select
                    value={form.controlUrologico}
                    onChange={(e) =>
                      update("controlUrologico", e.target.value as "si" | "no")
                    }
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Lugar control urológico</FieldLabel>
                  <Input
                    value={form.lugarControlUrologico}
                    onChange={(e) => update("lugarControlUrologico", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>Gral. orina</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaGralOrina}
                    onChange={(e) => update("fechaGralOrina", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Eco renal</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaEcoRenal}
                    onChange={(e) => update("fechaEcoRenal", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Est. urodinámico</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaEstUrodinamico}
                    onChange={(e) => update("fechaEstUrodinamico", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>TAC cerebro</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaTacCerebro}
                    onChange={(e) => update("fechaTacCerebro", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Urocultivo</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaUrocultivo}
                    onChange={(e) => update("fechaUrocultivo", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>UroTAC</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaUroTac}
                    onChange={(e) => update("fechaUroTac", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Últ. est. uro.</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaUltEstUro}
                    onChange={(e) => update("fechaUltEstUro", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Otros estudios</FieldLabel>
                  <Input
                    type="date"
                    value={form.fechaOtrosEstudios}
                    onChange={(e) => update("fechaOtrosEstudios", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "Historial padres" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Historial madre</p>
                <Input
                  placeholder="Lugar nacimiento"
                  value={form.madreLugarNacimiento}
                  onChange={(e) => update("madreLugarNacimiento", e.target.value)}
                />
                <Input
                  placeholder="Escolaridad"
                  value={form.madreEscolaridad}
                  onChange={(e) => update("madreEscolaridad", e.target.value)}
                />
                <Input
                  placeholder="Edad"
                  value={form.madreEdad}
                  onChange={(e) => update("madreEdad", e.target.value)}
                />
                <Input
                  placeholder="Ocupación"
                  value={form.madreOcupacion}
                  onChange={(e) => update("madreOcupacion", e.target.value)}
                />
                <Select
                  value={form.madreParentescoConPareja}
                  onChange={(e) =>
                    update("madreParentescoConPareja", e.target.value as "si" | "no")
                  }
                >
                  <option value="no">Parentesco con pareja: No</option>
                  <option value="si">Parentesco con pareja: Sí</option>
                </Select>
                <Input
                  placeholder="Cd. inicio embarazo"
                  value={form.madreCdInicioEmbarazo}
                  onChange={(e) => update("madreCdInicioEmbarazo", e.target.value)}
                />
                <Select
                  value={form.madreAcidoFolicoAntesDuranteEmbarazo}
                  onChange={(e) =>
                    update(
                      "madreAcidoFolicoAntesDuranteEmbarazo",
                      e.target.value as "si" | "no",
                    )
                  }
                >
                  <option value="no">Ácido fólico: No</option>
                  <option value="si">Ácido fólico: Sí</option>
                </Select>
                <Input
                  placeholder="Cantidad citas control prenatal"
                  value={form.madreCantidadCitasControlPrenatal}
                  onChange={(e) =>
                    update("madreCantidadCitasControlPrenatal", e.target.value)
                  }
                />
                <Input
                  placeholder="Seguro"
                  value={form.madreSeguro}
                  onChange={(e) => update("madreSeguro", e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Historial padre</p>
                <Input
                  placeholder="Lugar nacimiento"
                  value={form.padreLugarNacimiento}
                  onChange={(e) => update("padreLugarNacimiento", e.target.value)}
                />
                <Input
                  placeholder="Escolaridad"
                  value={form.padreEscolaridad}
                  onChange={(e) => update("padreEscolaridad", e.target.value)}
                />
                <Input
                  placeholder="Edad"
                  value={form.padreEdad}
                  onChange={(e) => update("padreEdad", e.target.value)}
                />
                <Input
                  placeholder="Ocupación"
                  value={form.padreOcupacion}
                  onChange={(e) => update("padreOcupacion", e.target.value)}
                />
                <Select
                  value={form.padreParentescoConPareja}
                  onChange={(e) =>
                    update("padreParentescoConPareja", e.target.value as "si" | "no")
                  }
                >
                  <option value="no">Parentesco con pareja: No</option>
                  <option value="si">Parentesco con pareja: Sí</option>
                </Select>
                <Input
                  placeholder="Seguro"
                  value={form.padreSeguro}
                  onChange={(e) => update("padreSeguro", e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Historial ambos</p>
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
                  onChange={(e) =>
                    update("exposicionToxicosEmbarazo", e.target.value as "si" | "no")
                  }
                >
                  <option value="no">Exposición a tóxicos: No</option>
                  <option value="si">Exposición a tóxicos: Sí</option>
                </Select>
                <Textarea
                  placeholder="Descripción toxinas"
                  value={form.descripcionToxinas}
                  onChange={(e) => update("descripcionToxinas", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {submitError ? (
            <p className="text-sm text-rose-700" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" disabled={submitting} onClick={agregarAsociado}>
            {submitting ? "Guardando..." : "Guardar asociado"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

