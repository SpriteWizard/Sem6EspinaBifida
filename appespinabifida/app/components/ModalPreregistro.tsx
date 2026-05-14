"use client";

import { useState, useEffect } from "react";
import { type PreregistroDetalle } from "./ListaPreregistro";
import { Textarea } from "./ui/Textarea";

type EstatusPreregistro = "Pendiente" | "Anulado";
type Vista = "modal" | "nota";

interface ConfirmConfig {
  mensaje: string;
  onConfirmar: () => void;
}

interface ModalPreregistroProps {
  preregistro: PreregistroDetalle;
  onClose: () => void;
  onAceptar: (id: string) => void;
  onAnular: (id: string, nota: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-base font-medium text-gray-900 leading-snug">{children || "—"}</span>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-bold uppercase tracking-widest text-[#003c64]">{label}</span>
      <div className="flex-1 h-px bg-[#003c64]/15" />
    </div>
  );
}

function SiNo({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <span className="text-base font-medium text-gray-900">—</span>;
  return <span className="text-base font-medium text-gray-900">{value ? "Sí" : "No"}</span>;
}

const badgeColors: Record<EstatusPreregistro, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  Anulado:   "bg-red-100 text-red-800",
};

export default function ModalPreregistro({
  preregistro,
  onClose,
  onAceptar,
  onAnular,
  onPrev,
  onNext,
}: ModalPreregistroProps) {
  const isAnulado = preregistro.estatus === "Anulado";
  const TABS = isAnulado
    ? ["Datos generales", "Historial", "Historial padres", "Notas"]
    : ["Datos generales", "Historial", "Historial padres"];

  const [activeTab, setActiveTab] = useState("Datos generales");
  const [vista, setVista] = useState<Vista>("modal");
  const [nota, setNota] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const p = preregistro;

  useEffect(() => {
    setActiveTab("Datos generales");
    setVista("modal");
    setNota("");
  }, [preregistro.id]);

  function pedir(mensaje: string, onConfirmar: () => void) {
    setConfirmConfig({ mensaje, onConfirmar });
  }

  function handleAceptar() {
    pedir(
      "¿Confirmas que deseas aceptar este preregistro como asociado?",
      () => onAceptar(preregistro.id),
    );
  }

  function handleAnular() {
    pedir(
      "¿Estás seguro de que deseas anular este preregistro?",
      () => setVista("nota"),
    );
  }

  function handleAnularFinal() {
    onAnular(preregistro.id, nota);
  }

  return (
    <>
      {/* ── Diálogo de confirmación ── */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-5">
            <p className="text-base font-medium text-gray-800">{confirmConfig.mensaje}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirmar();
                  setConfirmConfig(null);
                }}
                className="rounded-md bg-[#003c64] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003c64]/90"
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal principal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl xl:max-w-6xl">

          {/* ── Vista: nota de anulación ── */}
          {vista === "nota" && (
            <>
              <div className="flex items-center gap-4 px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setVista("modal")}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Volver
                </button>
                <h2 className="text-xl font-bold text-[#003c64]">Nota de anulación</h2>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0 px-8 py-7 space-y-3">
                <p className="text-sm text-gray-500">
                  Describe el motivo por el que se anula este preregistro. Esta nota quedará guardada y será visible al consultar el registro.
                </p>
                <Textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={6}
                  placeholder="Escribe aquí el motivo de la anulación..."
                />
              </div>
              <div className="flex justify-end border-t border-gray-100 px-8 py-4 shrink-0">
                <button
                  type="button"
                  onClick={handleAnularFinal}
                  disabled={nota.trim().length === 0}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anular
                </button>
              </div>
            </>
          )}

          {/* ── Vista: modal normal ── */}
          {vista === "modal" && (
            <>
              {/* ── Header ── */}
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
                    <h2 className="text-2xl font-bold text-[#003c64] leading-tight truncate">{p.nombre}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">ID&nbsp;{p.id}</p>
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
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="ID">{p.id}</Field>
                      <Field label="Fecha de solicitud">{p.fechaSolicitud}</Field>
                    </div>
                    <Field label="Nombre completo">{p.nombre}</Field>
                    <Field label="CURP">
                      <span className="font-mono tracking-wide">{p.curp}</span>
                    </Field>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Fecha de nacimiento">{p.fechaNacimiento}</Field>
                      <Field label="Edad">{p.edad}</Field>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Sexo">{p.sexo}</Field>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estatus</span>
                        <span className={`self-start rounded-full px-4 py-1 text-sm font-semibold ${badgeColors[p.estatus]}`}>
                          {p.estatus}
                        </span>
                      </div>
                    </div>

                    <Divider label="Datos personales" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Nombre padre / madre">{p.nombrePadreMadre}</Field>
                      <Field label="Etapa de vida">{p.etapaVida}</Field>
                    </div>

                    <Divider label="Dirección" />
                    <div className="space-y-5">
                      <Field label="Calle y número">{p.direccion}</Field>
                      <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                        <Field label="Ciudad">{p.ciudad}</Field>
                        <Field label="Estado">{p.estado}</Field>
                        <Field label="CP">{p.cp}</Field>
                      </div>
                    </div>

                    <Divider label="Contacto" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Teléfono casa">{p.telCasa}</Field>
                      <Field label="Teléfono trabajo">{p.telTrabajo}</Field>
                      <Field label="Teléfono celular">{p.telCel}</Field>
                      <Field label="Correo electrónico">{p.correo}</Field>
                    </div>

                    <Divider label="Emergencia" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Avisar a">{p.contactoEmergencia?.nombre}</Field>
                      <Field label="Teléfono de aviso">
                        {p.contactoEmergencia?.telefono}
                        {p.contactoEmergencia?.relacion && (
                          <span className="text-gray-500 text-sm"> ({p.contactoEmergencia.relacion})</span>
                        )}
                      </Field>
                    </div>
                  </div>
                )}

                {/* HISTORIAL */}
                {activeTab === "Historial" && (
                  <div className="space-y-8">
                    <Divider label="Historial" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Lugar nac.">{p.lugarNacimiento}</Field>
                      <Field label="Hospital">{p.hospital}</Field>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Padecimiento</span>
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 whitespace-pre-line min-h-[4.5rem] leading-relaxed">
                        {p.padecimiento || "—"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <Field label="Sangre (tipo)">{p.tipoSangre}</Field>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">¿Válvula?</span>
                        <SiNo value={p.valvula} />
                      </div>
                    </div>

                    <Divider label="Fecha de últimos estudios" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Control urológico</span>
                        <SiNo value={p.controlUrologico} />
                      </div>
                      <Field label="Lugar control urológico">{p.lugarControlUrologico}</Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-5">
                        <Field label="Gral. orina">{p.fechaGralOrina}</Field>
                        <Field label="Eco renal">{p.fechaEcoRenal}</Field>
                        <Field label="Est. urodinámico">{p.fechaEstUrodinamico}</Field>
                        <Field label="TAC cerebro">{p.fechaTacCerebro}</Field>
                      </div>
                      <div className="space-y-5">
                        <Field label="Urocultivo">{p.fechaUrocultivo}</Field>
                        <Field label="UroTAC">{p.fechaUroTac}</Field>
                        <Field label="Últ. est. uro.">{p.fechaUltEstUro}</Field>
                        <Field label="Otros">{p.fechaOtrosEstudios}</Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* HISTORIAL PADRES */}
                {activeTab === "Historial padres" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 xl:grid-cols-3">
                      <div className="min-w-0 space-y-5">
                        <Divider label="Historial madre" />
                        <Field label="Lugar nac.">{p.madreLugarNacimiento}</Field>
                        <Field label="Escolaridad">{p.madreEscolaridad}</Field>
                        <Field label="Edad">{p.madreEdad}</Field>
                        <Field label="Ocupación">{p.madreOcupacion}</Field>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Parentesco con pareja</span>
                          <SiNo value={p.madreParentescoConPareja} />
                        </div>
                        <Field label="Cd. inicio embarazo">{p.madreCdInicioEmbarazo}</Field>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ácido fólico antes o durante embarazo</span>
                          <SiNo value={p.madreAcidoFolicoAntesDuranteEmbarazo} />
                        </div>
                        <Field label="Cant. citas ctrl. prenatal">{p.madreCantidadCitasControlPrenatal}</Field>
                        <Field label="Seguro">{p.madreSeguro}</Field>
                      </div>

                      <div className="min-w-0 space-y-5">
                        <Divider label="Historial padre" />
                        <Field label="Lugar nacimiento">{p.padreLugarNacimiento}</Field>
                        <Field label="Escolaridad">{p.padreEscolaridad}</Field>
                        <Field label="Edad">{p.padreEdad}</Field>
                        <Field label="Ocupación">{p.padreOcupacion}</Field>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Parentesco con pareja</span>
                          <SiNo value={p.padreParentescoConPareja} />
                        </div>
                        <Field label="Seguro">{p.padreSeguro}</Field>
                      </div>

                      <div className="min-w-0 space-y-5">
                        <Divider label="Historial ambos" />
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Adicciones</span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 whitespace-pre-line min-h-[4.5rem] leading-relaxed">
                            {p.adiccionesAmbos || "—"}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ha tenido otro hijo con DTN</span>
                          <SiNo value={p.otroHijoConDTN} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tiene algún familiar con DTN</span>
                          <SiNo value={p.familiarConDTN} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Exposición a tóxicos antes o durante embarazo</span>
                          <SiNo value={p.exposicionToxicosEmbarazo} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Descripción toxinas</span>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 whitespace-pre-line min-h-[4.5rem] leading-relaxed">
                            {p.descripcionToxinas || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTAS (solo para anulados) */}
                {activeTab === "Notas" && isAnulado && (
                  <div className="space-y-4">
                    <Divider label="Nota de anulación" />
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900 whitespace-pre-line leading-relaxed min-h-32">
                      {p.notaAnulacion || "Sin nota registrada."}
                    </div>
                  </div>
                )}

              </div>

              {/* ── Footer ── */}
              {!isAnulado && (
                <div className="flex justify-end gap-2 border-t border-gray-100 px-8 py-4 shrink-0">
                  <button
                    type="button"
                    onClick={handleAnular}
                    className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    Anular
                  </button>
                  <button
                    type="button"
                    onClick={handleAceptar}
                    className="rounded-md bg-[#003c64] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003c64]/90"
                  >
                    Aceptar
                  </button>
                </div>
              )}

            </>
          )}

        </div>
      </div>
    </>
  );
}
