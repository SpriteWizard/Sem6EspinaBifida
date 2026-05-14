"use client";


import ImprimirCredencialButton from "./ImprimirCredencialButton";
import { useEffect, useMemo, useState } from "react";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { useRouter } from "next/navigation";
import { Session } from "inspector/promises";


type Estatus = "Activo" | "Inactivo" | "Pendiente";
type Sexo = "Masculino" | "Femenino";

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  relacion: string;
}

export interface AsociadoDetalle {
  id: string;
  folio: string;
  nombre: string;
  fechaNacimiento: string;
  sexo: Sexo;
  curp: string;
  direccion: string;
  telefonos: string[];
  contactoEmergencia: ContactoEmergencia;
  fechaAlta: string;
  estatus: Estatus;
  fechaUltRecibo?: string;
  etapaVida?: string;
  vive?: boolean;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  lugarNacimiento?: string;
  hospital?: string;
  edad?: string;
  nombrePadreMadre?: string;
  ciudad?: string;
  estado?: string;
  cp?: string;
  telCasa?: string;
  telTrabajo?: string;
  telCel?: string;
  correo?: string;
  /** Pestaña Historial — clínico */
  padecimiento?: string;
  tipoSangre?: string;
  valvula?: boolean;
  controlUrologico?: boolean;
  lugarControlUrologico?: string;
  fechaGralOrina?: string;
  fechaEcoRenal?: string;
  fechaEstUrodinamico?: string;
  fechaTacCerebro?: string;
  fechaUrocultivo?: string;
  fechaUroTac?: string;
  fechaUltEstUro?: string;
  fechaOtrosEstudios?: string;
  madreLugarNacimiento?: string;
  madreEscolaridad?: string;
  madreEdad?: string;
  madreOcupacion?: string;
  madreParentescoConPareja?: boolean;
  madreCdInicioEmbarazo?: string;
  madreAcidoFolicoAntesDuranteEmbarazo?: boolean;
  madreCantidadCitasControlPrenatal?: string;
  madreSeguro?: string;
  padreLugarNacimiento?: string;
  padreEscolaridad?: string;
  padreEdad?: string;
  padreOcupacion?: string;
  padreParentescoConPareja?: boolean;
  padreSeguro?: string;
  adiccionesAmbos?: string;
  otroHijoConDTN?: boolean;
  familiarConDTN?: boolean;
  exposicionToxicosEmbarazo?: boolean;
  descripcionToxinas?: string;
  fotoUrl?: string;
}

interface ModalAsociadoProps {
  asociado: AsociadoDetalle;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSave?: (next: AsociadoDetalle) => void;
}

const TABS = ["Datos generales", "Historial", "Historial padres", "Credencial"];

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-100 text-green-800",
  Inactivo: "bg-red-100 text-red-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-base font-medium text-gray-900 leading-snug">
        {children || "—"}
      </span>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-bold uppercase tracking-widest text-[#003c64]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#003c64]/15" />
    </div>
  );
}

function SiNo({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <span className="text-base font-medium text-gray-900">—</span>;
  return (
    <span className="text-base font-medium text-gray-900">{value ? "Sí" : "No"}</span>
  );
}

function SiNoSelect({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <Select value={value ? "si" : "no"} onChange={(e) => onChange(e.target.value === "si")}>
      <option value="si">Sí</option>
      <option value="no">No</option>
    </Select>
  );
}

function mergeDetalle(a: AsociadoDetalle) {
  const [t0, t1, t2] = a.telefonos;
  return {
    fechaUltRecibo: "—",
    etapaVida: "—",
    vive: true as boolean,
    vigenciaDesde: "—",
    vigenciaHasta: "—",
    lugarNacimiento: "—",
    hospital: "—",
    edad: "—",
    nombrePadreMadre: "—",
    ciudad: "—",
    estado: "—",
    cp: "—",
    correo: "—",
    padecimiento: "—",
    tipoSangre: "—",
    lugarControlUrologico: "—",
    fechaGralOrina: "—",
    fechaEcoRenal: "—",
    fechaEstUrodinamico: "—",
    fechaTacCerebro: "—",
    fechaUrocultivo: "—",
    fechaUroTac: "—",
    fechaUltEstUro: "—",
    fechaOtrosEstudios: "—",
    madreLugarNacimiento: "—",
    madreEscolaridad: "—",
    madreEdad: "—",
    madreOcupacion: "—",
    madreCdInicioEmbarazo: "—",
    madreCantidadCitasControlPrenatal: "—",
    madreSeguro: "—",
    padreLugarNacimiento: "—",
    padreEscolaridad: "—",
    padreEdad: "—",
    padreOcupacion: "—",
    padreSeguro: "—",
    adiccionesAmbos: "—",
    descripcionToxinas: "—",
    ...a,
    telCasa: a.telCasa ?? t0 ?? "—",
    telTrabajo: a.telTrabajo ?? t1 ?? "—",
    telCel: a.telCel ?? t2 ?? t1 ?? t0 ?? "—",
    fotoUrl: ""
  };
} 
import { useSession } from "next-auth/react";

export default function ModalAsociado({
  asociado,
  onClose,
  onPrev,
  onNext,
  onSave,
}: ModalAsociadoProps) {

  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("Datos generales");
  const base = useMemo(() => mergeDetalle(asociado), [asociado]);
  const [draft, setDraft] = useState(() => mergeDetalle(asociado));
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setDraft(base);
    setIsEditMode(false);
    setActiveTab("Datos generales");
  }, [base]);

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(base),
    [draft, base],
  );

  function updateDraft<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancelEdit() {
    if (hasChanges && !window.confirm("¿Descartar cambios sin guardar?")) return;
    setDraft(base);
    setIsEditMode(false);
  }

  async function handleSave() {
    const telefonos = [draft.telCasa, draft.telTrabajo, draft.telCel].filter(
      (v) => Boolean(v && v !== "—"),
    ) as string[];

    const next: AsociadoDetalle = {
      ...draft,
      telefonos: telefonos.length ? telefonos : ["—"],
      contactoEmergencia: draft.contactoEmergencia,
    };

    const res = await fetch("/api/asociados/editar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    })
    
    onSave?.(next);
    setIsEditMode(false);

    if (res.ok){
      const data = await res.json();
      if(data.status = "ok"){
        window.location.reload();
      }
    }

  }

  const [foto, setFoto] = useState("");

  async function buildImageSrc() {
    const obj = await (await fetch(`/api/asociados/fotoAsociado/obtener?id=${asociado.id}`)).json()
    if (!obj || !obj.image || !obj.mime) {
      throw new Error("Invalid image object");
    }
    
    setFoto(`data:${obj.mime};base64,${obj.image}`);
    return;
  }

  useEffect(()=>{
    buildImageSrc();

  },[])

  function handleClose() {
    if (isEditMode && hasChanges) {
      const shouldDiscard = window.confirm(
        "Hay cambios sin guardar. ¿Deseas cerrar y descartarlos?",
      );
      if (!shouldDiscard) return;
    }
    onClose();
  }

  const d = draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl xl:max-w-6xl">

        <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-[#003c64]"
                aria-label="Anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-[#003c64] leading-tight truncate">
                {d.nombre}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                ID&nbsp;{d.id} &middot; Folio&nbsp;{d.folio}
              </p>
            </div>

            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-[#003c64]"
                aria-label="Siguiente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 ml-4 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-3 shrink-0">
          <p className="text-sm text-gray-500">
            {isEditMode ? "Modo edición activado" : "Modo vista"}
          </p>
          <div className="flex gap-2">
            { ((session as any).user as any).role === "admin" || ((session as any).user as any).role === "superadmin" &&
            (isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md bg-[#003c64] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#003c64]/90"
                >
                  Guardar cambios
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="rounded-md border border-[#003c64]/20 bg-[#003c64]/5 px-3 py-1.5 text-sm font-semibold text-[#003c64] hover:bg-[#003c64]/10"
              >
                Editar
              </button>
            ))}
          </div>
        </div>

        {/* ── Pestañas ── */}
        <div className="flex gap-1 px-8 pt-4 pb-0 shrink-0 border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-[#003c64] text-[#003c64] bg-[#003c64]/5"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Contenido ── */}
        <div className="overflow-y-auto flex-1 min-h-0 px-8 py-7">

          {/* DATOS GENERALES */}
          {activeTab === "Datos generales" && (
            <div className="space-y-7">

              {/* Identificación + foto */}
              <div className="flex gap-8 items-start">
                <div className="flex-1 space-y-5">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <Field label="ID">{d.id}</Field>
                    <Field label="Fecha de alta">{d.fechaAlta}</Field>
                  </div>
                    {isEditMode ? (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Nombre completo
                        </span>
                        <Input value={d.nombre} onChange={(e) => updateDraft("nombre", e.target.value)} />
                      </div>
                    ) : (
                      <Field label="Nombre completo">{d.nombre}</Field>
                    )}
                  {isEditMode ? (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        CURP
                      </span>
                      <Input value={d.curp} onChange={(e) => updateDraft("curp", e.target.value)} />
                    </div>
                  ) : (
                    <Field label="CURP">
                      <span className="font-mono tracking-wide">{d.curp}</span>
                    </Field>
                  )}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {isEditMode ? (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Fecha de nacimiento
                        </span>
                        <Input value={d.fechaNacimiento} onChange={(e) => updateDraft("fechaNacimiento", e.target.value)} />
                      </div>
                    ) : (
                      <Field label="Fecha de nacimiento">{d.fechaNacimiento}</Field>
                    )}
                    {isEditMode ? (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Edad
                        </span>
                        <Input value={d.edad} onChange={(e) => updateDraft("edad", e.target.value)} />
                      </div>
                    ) : (
                      <Field label="Edad">{d.edad}</Field>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {isEditMode ? (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Sexo
                        </span>
                        <Select value={d.sexo} onChange={(e) => updateDraft("sexo", e.target.value as Sexo)}>
                          <option value="Femenino">Femenino</option>
                          <option value="Masculino">Masculino</option>
                        </Select>
                      </div>
                    ) : (
                      <Field label="Sexo">{d.sexo}</Field>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estatus</span>
                      {isEditMode ? (
                        <Select value={d.estatus} onChange={(e) => updateDraft("estatus", e.target.value as Estatus)}>
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                          <option value="Pendiente">Pendiente</option>
                        </Select>
                      ) : (
                        <span className={`self-start rounded-full px-4 py-1 text-sm font-semibold ${badgeColors[d.estatus]}`}>
                          {d.estatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Foto */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Foto</span>
                  {foto != "" ? (
                    <img
                      src={foto}
                      alt={`Foto de ${d.nombre}`}
                      className="h-28 w-28 rounded-xl border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 text-center">
                      {}
                    </div>
                  )}
                </div>
              </div>

              <Divider label="Datos personales" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {isEditMode ? (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Nombre padre / madre
                    </span>
                    <Input value={d.nombrePadreMadre} onChange={(e) => updateDraft("nombrePadreMadre", e.target.value)} />
                  </div>
                ) : (
                  <Field label="Nombre padre / madre">{d.nombrePadreMadre}</Field>
                )}
                {isEditMode ? (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Etapa de vida
                    </span>
                    <Input value={d.etapaVida} onChange={(e) => updateDraft("etapaVida", e.target.value)} />
                  </div>
                ) : (
                  <Field label="Etapa de vida">{d.etapaVida}</Field>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">¿Vive?</span>
                  {isEditMode ? (
                    <SiNoSelect value={d.vive} onChange={(next) => updateDraft("vive", next)} />
                  ) : (
                    <span className="text-base font-medium text-gray-900">{d.vive ? "Sí" : "No"}</span>
                  )}
                </div>
                {isEditMode ? (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Fecha últ. recibo
                    </span>
                    <Input value={d.fechaUltRecibo} onChange={(e) => updateDraft("fechaUltRecibo", e.target.value)} />
                  </div>
                ) : (
                  <Field label="Fecha últ. recibo">{d.fechaUltRecibo}</Field>
                )}
              </div>

              <Divider label="Dirección" />
              <div className="space-y-5">
                {isEditMode ? (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Calle y número
                    </span>
                    <Input value={d.direccion} onChange={(e) => updateDraft("direccion", e.target.value)} />
                  </div>
                ) : (
                  <Field label="Calle y número">{d.direccion}</Field>
                )}
                <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                  {isEditMode ? (
                    <>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ciudad</span>
                        <Input value={d.ciudad} onChange={(e) => updateDraft("ciudad", e.target.value)} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estado</span>
                        <Input value={d.estado} onChange={(e) => updateDraft("estado", e.target.value)} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">CP</span>
                        <Input value={d.cp} onChange={(e) => updateDraft("cp", e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <Field label="Ciudad">{d.ciudad}</Field>
                      <Field label="Estado">{d.estado}</Field>
                      <Field label="CP">{d.cp}</Field>
                    </>
                  )}
                </div>
              </div>

              <Divider label="Contacto" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {isEditMode ? (
                  <>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono casa</span>
                      <Input value={d.telCasa} onChange={(e) => updateDraft("telCasa", e.target.value)} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono trabajo</span>
                      <Input value={d.telTrabajo} onChange={(e) => updateDraft("telTrabajo", e.target.value)} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono celular</span>
                      <Input value={d.telCel} onChange={(e) => updateDraft("telCel", e.target.value)} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Correo electrónico</span>
                      <Input value={d.correo} onChange={(e) => updateDraft("correo", e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Teléfono casa">{d.telCasa}</Field>
                    <Field label="Teléfono trabajo">{d.telTrabajo}</Field>
                    <Field label="Teléfono celular">{d.telCel}</Field>
                    <Field label="Correo electrónico">{d.correo}</Field>
                  </>
                )}
              </div>

              <Divider label="Emergencia" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {isEditMode ? (
                  <>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Avisar a</span>
                      <Input
                        value={d.contactoEmergencia.nombre}
                        onChange={(e) =>
                          updateDraft("contactoEmergencia", {
                            ...d.contactoEmergencia,
                            nombre: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono</span>
                        <Input
                          value={d.contactoEmergencia.telefono}
                          onChange={(e) =>
                            updateDraft("contactoEmergencia", {
                              ...d.contactoEmergencia,
                              telefono: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Relación</span>
                        <Input
                          value={d.contactoEmergencia.relacion}
                          onChange={(e) =>
                            updateDraft("contactoEmergencia", {
                              ...d.contactoEmergencia,
                              relacion: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Avisar a">{d.contactoEmergencia.nombre}</Field>
                    <Field label="Teléfono de aviso">
                      {d.contactoEmergencia.telefono}{" "}
                      <span className="text-gray-500 text-sm">({d.contactoEmergencia.relacion})</span>
                    </Field>
                  </>
                )}
              </div>

              <Divider label="Vigencia" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {isEditMode ? (
                  <>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Desde</span>
                      <Input value={d.vigenciaDesde} onChange={(e) => updateDraft("vigenciaDesde", e.target.value)} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hasta</span>
                      <Input value={d.vigenciaHasta} onChange={(e) => updateDraft("vigenciaHasta", e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Desde">{d.vigenciaDesde}</Field>
                    <Field label="Hasta">{d.vigenciaHasta}</Field>
                  </>
                )}
              </div>

            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === "Historial" && (
            <div className="space-y-8">
              <Divider label="Historial" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {isEditMode ? (
                  <>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lugar nac.</span>
                      <Input value={d.lugarNacimiento} onChange={(e) => updateDraft("lugarNacimiento", e.target.value)} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Hospital</span>
                      <Input value={d.hospital} onChange={(e) => updateDraft("hospital", e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Lugar nac.">{d.lugarNacimiento}</Field>
                    <Field label="Hospital">{d.hospital}</Field>
                  </>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Padecimiento
                </span>
                {isEditMode ? (
                  <Textarea value={d.padecimiento} onChange={(e) => updateDraft("padecimiento", e.target.value)} rows={4} />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 whitespace-pre-line min-h-18 leading-relaxed">
                    {d.padecimiento && d.padecimiento !== "—" ? d.padecimiento : "—"}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {isEditMode ? (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Sangre (tipo)
                    </span>
                    <Input value={d.tipoSangre} onChange={(e) => updateDraft("tipoSangre", e.target.value)} />
                  </div>
                ) : (
                  <Field label="Sangre (tipo)">{d.tipoSangre}</Field>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    ¿Válvula?
                  </span>
                  {isEditMode ? (
                    <SiNoSelect value={d.valvula} onChange={(next) => updateDraft("valvula", next)} />
                  ) : (
                    <SiNo value={d.valvula} />
                  )}
                </div>
              </div>

              <Divider label="Fecha de últimos estudios" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Control urológico
                  </span>
                  {isEditMode ? (
                    <SiNoSelect value={d.controlUrologico} onChange={(next) => updateDraft("controlUrologico", next)} />
                  ) : (
                    <SiNo value={d.controlUrologico} />
                  )}
                </div>
                {isEditMode ? (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Lugar control urológico
                    </span>
                    <Input value={d.lugarControlUrologico} onChange={(e) => updateDraft("lugarControlUrologico", e.target.value)} />
                  </div>
                ) : (
                  <Field label="Lugar control urológico">{d.lugarControlUrologico}</Field>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-5">
                  {isEditMode ? (
                    <>
                      <Input value={d.fechaGralOrina} onChange={(e) => updateDraft("fechaGralOrina", e.target.value)} placeholder="Gral. orina" />
                      <Input value={d.fechaEcoRenal} onChange={(e) => updateDraft("fechaEcoRenal", e.target.value)} placeholder="Eco renal" />
                      <Input value={d.fechaEstUrodinamico} onChange={(e) => updateDraft("fechaEstUrodinamico", e.target.value)} placeholder="Est. urodinámico" />
                      <Input value={d.fechaTacCerebro} onChange={(e) => updateDraft("fechaTacCerebro", e.target.value)} placeholder="TAC cerebro" />
                    </>
                  ) : (
                    <>
                      <Field label="Gral. orina">{d.fechaGralOrina}</Field>
                      <Field label="Eco renal">{d.fechaEcoRenal}</Field>
                      <Field label="Est. urodinámico">{d.fechaEstUrodinamico}</Field>
                      <Field label="TAC cerebro">{d.fechaTacCerebro}</Field>
                    </>
                  )}
                </div>
                <div className="space-y-5">
                  {isEditMode ? (
                    <>
                      <Input value={d.fechaUrocultivo} onChange={(e) => updateDraft("fechaUrocultivo", e.target.value)} placeholder="Urocultivo" />
                      <Input value={d.fechaUroTac} onChange={(e) => updateDraft("fechaUroTac", e.target.value)} placeholder="UroTAC" />
                      <Input value={d.fechaUltEstUro} onChange={(e) => updateDraft("fechaUltEstUro", e.target.value)} placeholder="Últ. est. uro." />
                      <Input value={d.fechaOtrosEstudios} onChange={(e) => updateDraft("fechaOtrosEstudios", e.target.value)} placeholder="Otros" />
                    </>
                  ) : (
                    <>
                      <Field label="Urocultivo">{d.fechaUrocultivo}</Field>
                      <Field label="UroTAC">{d.fechaUroTac}</Field>
                      <Field label="Últ. est. uro.">{d.fechaUltEstUro}</Field>
                      <Field label="Otros">{d.fechaOtrosEstudios}</Field>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Historial padres" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 xl:grid-cols-3">
                <div className="min-w-0 space-y-5">
                  <Divider label="Historial madre" />
                  <Field label="Lugar nac.">{isEditMode ? <Input value={d.madreLugarNacimiento} onChange={(e) => updateDraft("madreLugarNacimiento", e.target.value)} /> : d.madreLugarNacimiento}</Field>
                  <Field label="Escolaridad">{isEditMode ? <Input value={d.madreEscolaridad} onChange={(e) => updateDraft("madreEscolaridad", e.target.value)} /> : d.madreEscolaridad}</Field>
                  <Field label="Edad">{isEditMode ? <Input value={d.madreEdad} onChange={(e) => updateDraft("madreEdad", e.target.value)} /> : d.madreEdad}</Field>
                  <Field label="Ocupación">{isEditMode ? <Input value={d.madreOcupacion} onChange={(e) => updateDraft("madreOcupacion", e.target.value)} /> : d.madreOcupacion}</Field>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Parentesco con pareja
                    </span>
                    {isEditMode ? (
                      <SiNoSelect value={d.madreParentescoConPareja} onChange={(next) => updateDraft("madreParentescoConPareja", next)} />
                    ) : (
                      <SiNo value={d.madreParentescoConPareja} />
                    )}
                  </div>
                  <Field label="Cd. inicio embarazo">{isEditMode ? <Input value={d.madreCdInicioEmbarazo} onChange={(e) => updateDraft("madreCdInicioEmbarazo", e.target.value)} /> : d.madreCdInicioEmbarazo}</Field>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Ácido fólico antes o durante embarazo
                    </span>
                    {isEditMode ? (
                      <SiNoSelect value={d.madreAcidoFolicoAntesDuranteEmbarazo} onChange={(next) => updateDraft("madreAcidoFolicoAntesDuranteEmbarazo", next)} />
                    ) : (
                      <SiNo value={d.madreAcidoFolicoAntesDuranteEmbarazo} />
                    )}
                  </div>
                  <Field label="Cant. citas ctrl. prenatal">{isEditMode ? <Input value={d.madreCantidadCitasControlPrenatal} onChange={(e) => updateDraft("madreCantidadCitasControlPrenatal", e.target.value)} /> : d.madreCantidadCitasControlPrenatal}</Field>
                  <Field label="Seguro">{isEditMode ? <Input value={d.madreSeguro} onChange={(e) => updateDraft("madreSeguro", e.target.value)} /> : d.madreSeguro}</Field>
                </div>

                <div className="min-w-0 space-y-5">
                  <Divider label="Historial padre" />
                  <Field label="Lugar nacimiento">{isEditMode ? <Input value={d.padreLugarNacimiento} onChange={(e) => updateDraft("padreLugarNacimiento", e.target.value)} /> : d.padreLugarNacimiento}</Field>
                  <Field label="Escolaridad">{isEditMode ? <Input value={d.padreEscolaridad} onChange={(e) => updateDraft("padreEscolaridad", e.target.value)} /> : d.padreEscolaridad}</Field>
                  <Field label="Edad">{isEditMode ? <Input value={d.padreEdad} onChange={(e) => updateDraft("padreEdad", e.target.value)} /> : d.padreEdad}</Field>
                  <Field label="Ocupación">{isEditMode ? <Input value={d.padreOcupacion} onChange={(e) => updateDraft("padreOcupacion", e.target.value)} /> : d.padreOcupacion}</Field>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Parentesco con pareja
                    </span>
                    {isEditMode ? (
                      <SiNoSelect value={d.padreParentescoConPareja} onChange={(next) => updateDraft("padreParentescoConPareja", next)} />
                    ) : (
                      <SiNo value={d.padreParentescoConPareja} />
                    )}
                  </div>
                  <Field label="Seguro">{isEditMode ? <Input value={d.padreSeguro} onChange={(e) => updateDraft("padreSeguro", e.target.value)} /> : d.padreSeguro}</Field>
                </div>

                <div className="min-w-0 space-y-5">
                  <Divider label="Historial ambos" />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Adicciones
                    </span>
                    {isEditMode ? (
                      <Textarea value={d.adiccionesAmbos} onChange={(e) => updateDraft("adiccionesAmbos", e.target.value)} rows={3} />
                    ) : (
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 whitespace-pre-line min-h-18 leading-relaxed">
                        {d.adiccionesAmbos && d.adiccionesAmbos !== "—"
                          ? d.adiccionesAmbos
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Ha tenido otro hijo con DTN
                    </span>
                    {isEditMode ? (
                      <SiNoSelect value={d.otroHijoConDTN} onChange={(next) => updateDraft("otroHijoConDTN", next)} />
                    ) : (
                      <SiNo value={d.otroHijoConDTN} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Tiene algún familiar con DTN
                    </span>
                    {isEditMode ? (
                      <SiNoSelect value={d.familiarConDTN} onChange={(next) => updateDraft("familiarConDTN", next)} />
                    ) : (
                      <SiNo value={d.familiarConDTN} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Exposición a tóxicos antes o durante embarazo
                    </span>
                    {isEditMode ? (
                      <SiNoSelect value={d.exposicionToxicosEmbarazo} onChange={(next) => updateDraft("exposicionToxicosEmbarazo", next)} />
                    ) : (
                      <SiNo value={d.exposicionToxicosEmbarazo} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Descripción toxinas
                    </span>
                    {isEditMode ? (
                      <Textarea value={d.descripcionToxinas} onChange={(e) => updateDraft("descripcionToxinas", e.target.value)} rows={3} />
                    ) : (
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 whitespace-pre-line min-h-18 leading-relaxed">
                        {d.descripcionToxinas && d.descripcionToxinas !== "—"
                          ? d.descripcionToxinas
                          : "—"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Credencial" && (
            <div className="flex flex-col gap-6">
              
              <ImprimirCredencialButton asociado={asociado} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
