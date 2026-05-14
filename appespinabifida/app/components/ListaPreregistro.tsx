"use client";

import { useState, useEffect } from "react";
import ListaTabla from "./ListaTabla";
import ModalPreregistro from "./ModalPreregistro";

import { type FiltrosPreregistroValues } from "./FiltrosPreregistro";

// ─── INTEGRACIÓN BACKEND ─────────────────────────────────────────────────────
// Tres endpoints necesarios. Cuando estén listos, reemplaza las secciones
// marcadas con "TODO:" en el código:
//
//   GET  /api/preregistros/lista
//        Response: PreregistroDetalle[]
//
//   POST /api/preregistros/aceptar    Body: { id: string }
//        Response: { ok: boolean }
//
//   POST /api/preregistros/anular     Body: { id: string; nota: string }
//        Response: { ok: boolean }
//
// Mientras no haya backend, las acciones se imprimen en consola.
// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Datos generales (obligatorio) ─────────────────────────────────────────
  fechaNacimiento: string;
  sexo: string;
  curp: string;
  correo: string;
  telefono: string;
  nombrePadreMadre: string;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };

  // ── Dirección (opcional) ──────────────────────────────────────────────────
  direccion?: string;
  ciudad?: string;
  estado?: string;
  cp?: string;

  // ── Historial médico (opcional) ───────────────────────────────────────────
  lugarNacimiento?: string;
  hospital?: string;
  padecimiento?: string;
  tipoSangre?: string;
  valvula?: boolean;
}

// TODO: Eliminar datos dummy cuando el endpoint GET /api/preregistros/lista esté listo.
// Cada caso cubre una etapa de vida distinta y refleja qué campos opcionales
// puede o no haber llenado el solicitante.
const DUMMY_PREREGISTROS: PreregistroDetalle[] = [
  {
    // Edad escolar (8 años) — todos los campos completos
    id: "PR-001",
    nombre: "Ana Martínez López",
    fechaSolicitud: "10/04/2025",
    estatus: "Pendiente",
    fechaNacimiento: "05/03/2018",
    sexo: "Femenino",
    curp: "MALA180305MNLRTNA8",
    correo: "rosa.lopez@correo.com",
    telefono: "81 9876 5432",
    nombrePadreMadre: "Rosa López Vega",
    contactoEmergencia: { nombre: "Rosa López Vega", telefono: "81 9876 5432", relacion: "Madre" },
    direccion: "Calle Pino 12, Col. Jardines",
    ciudad: "Monterrey",
    estado: "Nuevo León",
    cp: "64000",
    lugarNacimiento: "Monterrey, N.L.",
    hospital: "IMSS",
    padecimiento: "Mielomeningocele\nHidrocefalia",
    tipoSangre: "O+",
    valvula: true,
  },
  {
    // Preescolar (5 años) — sin dirección; historial parcial
    id: "PR-002",
    nombre: "Luis Torres García",
    fechaSolicitud: "12/04/2025",
    estatus: "Pendiente",
    fechaNacimiento: "20/11/2020",
    sexo: "Masculino",
    curp: "TOGL201120HNLRRSA2",
    correo: "carmen.garcia@correo.com",
    telefono: "81 5555 1234",
    nombrePadreMadre: "Carmen García Reyes",
    contactoEmergencia: { nombre: "Carmen García Reyes", telefono: "81 5555 1234", relacion: "Madre" },
    // Dirección: no proporcionada
    padecimiento: "Espina bífida oculta",
    tipoSangre: "A+",
    valvula: false,
    // Hospital y lugar de nac: no proporcionados
  },
  {
    // Edad escolar (9 años) — Anulado; sin dirección ni historial médico
    id: "PR-003",
    nombre: "Sofía Ramírez Cruz",
    fechaSolicitud: "15/04/2025",
    estatus: "Anulado",
    notaAnulacion: "Documentación incompleta. El padre no presentó acta de nacimiento del menor. Se le indicó que puede volver a registrarse una vez que cuente con los documentos requeridos.",
    fechaNacimiento: "14/07/2016",
    sexo: "Femenino",
    curp: "RACS160714MDFRMZA8",
    correo: "marco.ramirez@correo.com",
    telefono: "55 6677 8899",
    nombrePadreMadre: "Marco Ramírez Díaz",
    contactoEmergencia: { nombre: "Marco Ramírez Díaz", telefono: "55 6677 8899", relacion: "Padre" },
    // Dirección e historial: no proporcionados
  },
  {
    // Primera infancia (1 año) — con dirección; sin historial médico (poco historial aún)
    id: "PR-004",
    nombre: "Valentina Ruiz Domínguez",
    fechaSolicitud: "18/04/2025",
    estatus: "Pendiente",
    fechaNacimiento: "10/02/2025",
    sexo: "Femenino",
    curp: "RUDV250210MNLZNDA4",
    correo: "elena.dominguez@correo.com",
    telefono: "81 3344 5566",
    nombrePadreMadre: "Elena Domínguez Vela",
    contactoEmergencia: { nombre: "Elena Domínguez Vela", telefono: "81 3344 5566", relacion: "Madre" },
    direccion: "Av. Constitución 780, Col. Centro",
    ciudad: "Monterrey",
    estado: "Nuevo León",
    cp: "64000",
    // Historial médico: no proporcionado
  },
  {
    // Adolescencia (16 años) — sin dirección; historial médico completo
    id: "PR-005",
    nombre: "Carlos Hernández Salinas",
    fechaSolicitud: "20/04/2025",
    estatus: "Pendiente",
    fechaNacimiento: "15/08/2009",
    sexo: "Masculino",
    curp: "HESC090815HNLRNDA3",
    correo: "carlos.hernandez@correo.com",
    telefono: "81 7788 9900",
    nombrePadreMadre: "Patricia Salinas Mora",
    contactoEmergencia: { nombre: "Patricia Salinas Mora", telefono: "81 7788 9900", relacion: "Madre" },
    // Dirección: no proporcionada
    lugarNacimiento: "Monterrey, N.L.",
    hospital: "Hospital Universitario UANL",
    padecimiento: "Mielomeningocele\nMédula anclada",
    tipoSangre: "B+",
    valvula: false,
  },
  {
    // Adulto joven (25 años) — Anulado; todos los campos completos
    id: "PR-006",
    nombre: "María García Flores",
    fechaSolicitud: "22/04/2025",
    estatus: "Anulado",
    notaAnulacion: "La solicitante ya se encuentra registrada con folio EB-0342 bajo el mismo nombre y CURP. Doble registro detectado.",
    fechaNacimiento: "22/03/2001",
    sexo: "Femenino",
    curp: "GAFM010322MNLRCLA5",
    correo: "maria.garcia@correo.com",
    telefono: "81 2233 4455",
    nombrePadreMadre: "Jorge García Reyes",
    contactoEmergencia: { nombre: "Jorge García Reyes", telefono: "81 2233 4455", relacion: "Padre" },
    direccion: "Calle Roble 55, Col. Del Valle",
    ciudad: "San Pedro Garza García",
    estado: "Nuevo León",
    cp: "66220",
    lugarNacimiento: "Monterrey, N.L.",
    hospital: "TEC Salud",
    padecimiento: "Espina bífida oculta",
    tipoSangre: "A-",
    valvula: false,
  },
  {
    // Preescolar (3 años) — sin historial médico; dirección parcial (sin CP)
    id: "PR-007",
    nombre: "Diego Vega Mora",
    fechaSolicitud: "25/04/2025",
    estatus: "Pendiente",
    fechaNacimiento: "08/09/2022",
    sexo: "Masculino",
    curp: "VEMD220908HJAGMRA7",
    correo: "isabel.mora@correo.com",
    telefono: "33 1122 3344",
    nombrePadreMadre: "Isabel Mora Castillo",
    contactoEmergencia: { nombre: "Isabel Mora Castillo", telefono: "33 1122 3344", relacion: "Madre" },
    ciudad: "Guadalajara",
    estado: "Jalisco",
    // Dirección, CP e historial médico: no proporcionados
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
    // TODO: Reemplazar con la llamada real cuando el backend esté listo:
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
            // TODO: conectar al backend:
            // await fetch("/api/preregistros/aceptar", { method: "POST", body: JSON.stringify({ id }) });
            console.log("[preregistro] Aceptar →", JSON.stringify({ id }, null, 2));
            setRawData((prev) => prev.filter((p) => p.id !== id));
            setSelectedIndex(null);
          }}
          onAnular={(id, nota) => {
            // TODO: conectar al backend:
            // await fetch("/api/preregistros/anular", { method: "POST", body: JSON.stringify({ id, nota }) });
            console.log("[preregistro] Anular →", JSON.stringify({ id, nota }, null, 2));
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
