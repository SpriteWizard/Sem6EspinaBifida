"use client";

import { useState, useEffect } from "react";
import ListaTabla from "./ListaTabla";
import ModalPreregistro from "./ModalPreregistro";

import { type FiltrosPreregistroValues } from "./FiltrosPreregistro";

export type EstatusPreregistro = "Pendiente" | "Anulado";

const badgeColors: Record<EstatusPreregistro, string> = {
  Pendiente: "bg-yellow-600/10 text-yellow-600",
  Anulado:   "bg-red-500/10 text-red-500",
};

export interface PreregistroDetalle {
  // ── Campos base ──────────────────────────────────────────────────────────
  id: string;
  nombre: string;
  fechaSolicitud: string;
  estatus: EstatusPreregistro;
  notaAnulacion?: string;

  // ── Datos generales ───────────────────────────────────────────────────────
  fechaNacimiento?: string;
  sexo?: string;
  curp?: string;
  edad?: string;
  nombrePadreMadre?: string;
  etapaVida?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  cp?: string;
  telCasa?: string;
  telTrabajo?: string;
  telCel?: string;
  correo?: string;
  contactoEmergencia?: {
    nombre: string;
    telefono: string;
    relacion: string;
  };

  // ── Historial clínico ─────────────────────────────────────────────────────
  lugarNacimiento?: string;
  hospital?: string;
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

  // ── Historial padres ──────────────────────────────────────────────────────
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
}

// TODO: Eliminar datos dummy cuando el endpoint de backend esté listo
const DUMMY_PREREGISTROS: PreregistroDetalle[] = [
  {
    id: "PR-001", nombre: "Ana Martínez López", fechaSolicitud: "10/04/2024", estatus: "Pendiente",
    fechaNacimiento: "05/03/2018", sexo: "Femenino", curp: "MALA180305MDFRRNA5", edad: "6",
    nombrePadreMadre: "Rosa López Vega", etapaVida: "Infancia",
    direccion: "Calle Pino 12, Col. Jardines", ciudad: "Monterrey", estado: "N.L.", cp: "64000",
    telCasa: "81 1234 5678", telCel: "81 9876 5432", correo: "rosa.lopez@email.com",
    contactoEmergencia: { nombre: "Rosa López Vega", telefono: "81 9876 5432", relacion: "Madre" },
    lugarNacimiento: "MONTERREY, N.L.", hospital: "IMSS",
    padecimiento: "MIELOMENINGOCELE\nHIDROCEFALIA",
    tipoSangre: "O+", valvula: true, controlUrologico: true, lugarControlUrologico: "Hospital Universitario",
    madreLugarNacimiento: "SALTILLO, COAH.", madreEscolaridad: "PREPARATORIA", madreEdad: "32",
    madreOcupacion: "HOGAR", madreParentescoConPareja: false, madreCdInicioEmbarazo: "MONTERREY, N.L.",
    madreAcidoFolicoAntesDuranteEmbarazo: true, madreCantidadCitasControlPrenatal: "8", madreSeguro: "IMSS",
    padreLugarNacimiento: "MONTERREY, N.L.", padreEscolaridad: "UNIVERSIDAD", padreEdad: "35",
    padreOcupacion: "EMPLEADO", padreParentescoConPareja: false, padreSeguro: "IMSS",
    otroHijoConDTN: false, familiarConDTN: false, exposicionToxicosEmbarazo: false,
  },
  {
    id: "PR-002", nombre: "Luis Torres García", fechaSolicitud: "12/04/2024", estatus: "Pendiente",
    fechaNacimiento: "20/11/2020", sexo: "Masculino", curp: "TOGL201120HDFRRS02", edad: "3",
    nombrePadreMadre: "Carmen García Reyes", etapaVida: "Primera infancia",
    direccion: "Av. Roble 45, Col. San Pedro", ciudad: "San Pedro Garza García", estado: "N.L.", cp: "66220",
    telCel: "81 5555 1234", correo: "carmen.garcia@email.com",
    contactoEmergencia: { nombre: "Carmen García Reyes", telefono: "81 5555 1234", relacion: "Madre" },
    lugarNacimiento: "SAN PEDRO GARZA GARCÍA, N.L.", hospital: "TEC SALUD",
    padecimiento: "ESPINA BÍFIDA OCULTA",
    tipoSangre: "A+", valvula: false, controlUrologico: false,
    madreEscolaridad: "UNIVERSIDAD", madreEdad: "28", madreOcupacion: "DOCENTE",
    madreParentescoConPareja: false, madreAcidoFolicoAntesDuranteEmbarazo: false,
    madreCantidadCitasControlPrenatal: "10", madreSeguro: "SEGURO POPULAR",
    padreEscolaridad: "UNIVERSIDAD", padreEdad: "30", padreOcupacion: "INGENIERO",
    padreParentescoConPareja: false, padreSeguro: "SEGURO POPULAR",
    otroHijoConDTN: false, familiarConDTN: true, exposicionToxicosEmbarazo: false,
  },
  {
    id: "PR-003", nombre: "Sofía Ramírez Cruz", fechaSolicitud: "15/04/2024", estatus: "Anulado",
    notaAnulacion: "Documentación incompleta. El padre no presentó acta de nacimiento del menor. Se le indicó que puede volver a registrarse una vez que cuente con los documentos requeridos.",
    fechaNacimiento: "14/07/2016", sexo: "Femenino", curp: "RACS160714MDFMRS08", edad: "7",
    direccion: "Calle Cedro 88, Col. Las Flores", ciudad: "CDMX", estado: "CDMX", cp: "07500",
    telCel: "55 6677 8899",
    contactoEmergencia: { nombre: "Marco Ramírez", telefono: "55 6677 8899", relacion: "Padre" },
    lugarNacimiento: "CDMX", padecimiento: "MIELOMENINGOCELE", tipoSangre: "B+", valvula: false,
  },
  {
    id: "PR-004", nombre: "Javier Mendoza Ríos", fechaSolicitud: "18/04/2024", estatus: "Anulado",
    notaAnulacion: "El paciente ya está registrado con folio EB-1007 bajo el nombre Francisco López Garrido. Doble registro detectado.",
    fechaNacimiento: "02/09/2019", sexo: "Masculino", curp: "MERJ190902HDFNSR01", edad: "4",
    direccion: "Av. Palmas 200, Col. Polanco", ciudad: "CDMX", estado: "CDMX", cp: "11560",
    telCel: "55 3344 5566",
    contactoEmergencia: { nombre: "Irene Ríos", telefono: "55 3344 5566", relacion: "Madre" },
    lugarNacimiento: "CDMX", padecimiento: "MIELOMENINGOCELE\nVÁLVULA DE DERIVACIÓN", tipoSangre: "O-",
    valvula: true, controlUrologico: true,
  },
  {
    id: "PR-005", nombre: "Claudia Vega Mora", fechaSolicitud: "20/04/2024", estatus: "Pendiente",
    fechaNacimiento: "30/06/2022", sexo: "Femenino", curp: "VEMC220630MDFGRL06", edad: "1",
    nombrePadreMadre: "Isabel Mora Castillo",
    direccion: "Calle Magnolia 3, Col. Residencial", ciudad: "Guadalajara", estado: "Jal.", cp: "44100",
    telCasa: "33 9988 7766", telCel: "33 1122 3344",
    contactoEmergencia: { nombre: "Isabel Mora Castillo", telefono: "33 1122 3344", relacion: "Madre" },
    lugarNacimiento: "GUADALAJARA, JAL.", hospital: "HOSPITAL CIVIL",
    padecimiento: "ESPINA BÍFIDA OCULTA", tipoSangre: "AB+", valvula: false, controlUrologico: false,
    madreEscolaridad: "SECUNDARIA", madreEdad: "25", madreOcupacion: "HOGAR",
    madreParentescoConPareja: false, madreAcidoFolicoAntesDuranteEmbarazo: false,
    madreCantidadCitasControlPrenatal: "6", madreSeguro: "SEGURO POPULAR",
    otroHijoConDTN: false, familiarConDTN: false, exposicionToxicosEmbarazo: false,
  },
];

const HEADERS = ["ID", "Nombre", "Fecha de solicitud", "Estatus"];

type ListaPreregistroProps = {
  filtros: FiltrosPreregistroValues;
};

export default function ListaPreregistro({ filtros }: ListaPreregistroProps) {
  const [rawData, setRawData] = useState<PreregistroDetalle[]>([]);
  const [data, setData] = useState<PreregistroDetalle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // TODO: Reemplazar con la llamada real al API cuando el backend esté listo:
    // const res = await fetch("/api/preregistros/lista");
    // if (res.ok) { const json = await res.json(); setRawData(json); }
    setRawData(DUMMY_PREREGISTROS);
    setData(DUMMY_PREREGISTROS);
  }, []);

  useEffect(() => {
    setData(rawData.filter((el) => {
      const idMatch     = !filtros.id || filtros.id === 0 || filtros.id === Number(el.id.replace("PR-", ""));
      const nombreMatch = !filtros.nombre  || el.nombre.includes(filtros.nombre);
      const fechaMatch  = !filtros.fecha   || filtros.fecha === el.fechaSolicitud;
      const statusMatch = !filtros.estatus || filtros.estatus === el.estatus;
      return idMatch && nombreMatch && fechaMatch && statusMatch;
    }));
  }, [filtros, rawData]);

  const rows = data.map((row) => ({
    key: row.id,
    cells: [
      row.id,
      row.nombre,
      row.fechaSolicitud,
      <span
        key="estatus"
        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[row.estatus]}`}
      >
        {row.estatus}
      </span>,
    ],
  }));

  const selectedPreregistro = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ListaTabla
          headers={HEADERS}
          rows={rows}
          onRowClick={setSelectedIndex}
        />
      </div>

      {selectedPreregistro !== null && selectedIndex !== null && (
        <ModalPreregistro
          preregistro={selectedPreregistro}
          onClose={() => setSelectedIndex(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedIndex(selectedIndex - 1) : undefined}
          onNext={selectedIndex < data.length - 1 ? () => setSelectedIndex(selectedIndex + 1) : undefined}
          onAceptar={(id) => {
            // TODO: POST /api/preregistros/aceptar cuando el backend esté listo
            setRawData((prev) => prev.filter((p) => p.id !== id));
            setSelectedIndex(null);
          }}
          onAnular={(id, nota) => {
            // TODO: POST /api/preregistros/anular cuando el backend esté listo
            setRawData((prev) =>
              prev.map((p) =>
                p.id === id ? { ...p, estatus: "Anulado" as const, notaAnulacion: nota } : p
              )
            );
            setSelectedIndex(null);
          }}
        />
      )}
    </>
  );
}
