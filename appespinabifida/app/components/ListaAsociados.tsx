"use client";

import { useState } from "react";
import { useEffect} from "react";
import ListaTabla from "./ListaTabla";
import ModalAsociado, { type AsociadoDetalle } from "./ModalAsociado";

type Estatus = "Activo" | "Inactivo" | "Pendiente";

const badgeColors: Record<Estatus, string> = {
  Activo: "bg-green-600/10 text-green-600",
  Inactivo: "bg-red-500/10 text-red-500",
  Pendiente: "bg-yellow-600/10 text-yellow-600",
};

export const initialAsociadosData: AsociadoDetalle[] = [
  {
    id: "EB-1002",
    folio: "EB-1002",
    nombre: "María García Hernández",
    fechaNacimiento: "15/06/2010",
    sexo: "Femenino",
    curp: "GAHM100615MDFRRRA2",
    direccion: "Calle Reforma 123, Col. Centro, CDMX, CP 06000",
    telefonos: ["55 1234 5678", "55 8765 4321"],
    contactoEmergencia: {
      nombre: "Juan García López",
      telefono: "55 1111 2222",
      relacion: "Padre",
    },
    fechaAlta: "20/03/2024",
    estatus: "Inactivo",
    lugarNacimiento: "MONTERREY, N.L.",
    hospital: "GINE-IMSS",
    padecimiento: "MIELOMENINGOCELE\nHIDROCEFALIA",
    valvula: true,
    controlUrologico: false,
    madreLugarNacimiento: "SAN LUIS POTOSI",
    madreEscolaridad: "SECUNDARIA",
    madreEdad: "45",
    madreOcupacion: "HOGAR",
    madreParentescoConPareja: false,
    madreCdInicioEmbarazo: "MONTERREY, N.L.",
    madreAcidoFolicoAntesDuranteEmbarazo: false,
    madreCantidadCitasControlPrenatal: "9",
    madreSeguro: "SEGURO POPULAR",
    padreLugarNacimiento: "MONTERREY, N.L.",
    padreEscolaridad: "SECUNDARIA",
    padreEdad: "47",
    padreOcupacion: "EMPLEADA(O)",
    padreParentescoConPareja: false,
    padreSeguro: "SEGURO POPULAR",
    otroHijoConDTN: false,
    familiarConDTN: false,
    exposicionToxicosEmbarazo: false,
  },
  {
    id: "EB-1003", folio: "EB-1003", nombre: "Carlos Rodríguez Martínez",
    fechaNacimiento: "22/03/2015", sexo: "Masculino", curp: "ROMC150322HDFDRS09",
    direccion: "Av. Insurgentes Sur 456, Col. Del Valle, CDMX, CP 03100",
    telefonos: ["55 2345 6789"],
    contactoEmergencia: { nombre: "Ana Martínez Ruiz", telefono: "55 3333 4444", relacion: "Madre" },
    fechaAlta: "10/10/2024", estatus: "Activo"
  },
  {
    id: "EB-1004", folio: "EB-1004", nombre: "Laura Sánchez Pérez",
    fechaNacimiento: "08/11/2012", sexo: "Femenino", curp: "SAPL121108MDFNRR01",
    direccion: "Calle Hidalgo 789, Col. Juárez, CDMX, CP 06600",
    telefonos: ["55 3456 7890", "55 0987 6543"],
    contactoEmergencia: { nombre: "Roberto Sánchez Díaz", telefono: "55 5555 6666", relacion: "Padre" },
    fechaAlta: "10/05/2024", estatus: "Activo"
  },
  {
    id: "EB-1005", folio: "EB-1005", nombre: "Pedro Gómez Ruiz",
    fechaNacimiento: "30/01/2008", sexo: "Masculino", curp: "GORP080130HDFMZD02",
    direccion: "Av. Universidad 321, Col. Narvarte, CDMX, CP 03020",
    telefonos: ["55 4567 8901"],
    contactoEmergencia: { nombre: "María Ruiz Hernández", telefono: "55 7777 8888", relacion: "Madre" },
    fechaAlta: "20/03/2024", estatus: "Inactivo"
  },
  {
    id: "EB-1006", folio: "EB-1006", nombre: "Laura Gómez Ramírez",
    fechaNacimiento: "14/09/2018", sexo: "Femenino", curp: "GORL180914MDFMRR05",
    direccion: "Calle Morelos 567, Col. Roma, CDMX, CP 06700",
    telefonos: ["55 5678 9012", "55 2109 8765"],
    contactoEmergencia: { nombre: "José Gómez Flores", telefono: "55 9999 0000", relacion: "Padre" },
    fechaAlta: "07/10/2024", estatus: "Activo"
  },
  {
    id: "EB-1007", folio: "EB-1007", nombre: "Francisco López Garrido",
    fechaNacimiento: "25/04/2016", sexo: "Masculino", curp: "LOGF160425HDFPRR08",
    direccion: "Av. Chapultepec 890, Col. Condesa, CDMX, CP 06140",
    telefonos: ["55 6789 0123"],
    contactoEmergencia: { nombre: "Carmen Garrido Mendoza", telefono: "55 1212 3434", relacion: "Madre" },
    fechaAlta: "19/05/2024", estatus: "Activo"
  },
  {
    id: "EB-1008", folio: "EB-1008", nombre: "María García Pérez",
    fechaNacimiento: "03/12/2014", sexo: "Femenino", curp: "GAPM141203MDFRRR04",
    direccion: "Calle Juárez 234, Col. Centro, CDMX, CP 06010",
    telefonos: ["55 7890 1234", "55 4321 0987"],
    contactoEmergencia: { nombre: "Luis García Torres", telefono: "55 5656 7878", relacion: "Padre" },
    fechaAlta: "20/03/2024", estatus: "Activo"
  },
  {
    id: "EB-1009", folio: "EB-1009", nombre: "Pedro Gómez Ruiz",
    fechaNacimiento: "17/07/2011", sexo: "Masculino", curp: "GORP110717HDFMZD07",
    direccion: "Av. Revolución 456, Col. San Ángel, CDMX, CP 01000",
    telefonos: ["55 8901 2345"],
    contactoEmergencia: { nombre: "Elena Ruiz Vargas", telefono: "55 9090 1212", relacion: "Madre" },
    fechaAlta: "10/03/2024", estatus: "Activo"
  },
  {
    id: "EB-1010", folio: "EB-1010", nombre: "Laura Vélez Pérez",
    fechaNacimiento: "28/02/2017", sexo: "Femenino", curp: "VEPL170228MDFLRR03",
    direccion: "Calle Madero 678, Col. Centro, CDMX, CP 06000",
    telefonos: ["55 9012 3456", "55 6543 2109"],
    contactoEmergencia: { nombre: "Miguel Vélez Soto", telefono: "55 3434 5656", relacion: "Padre" },
    fechaAlta: "15/03/2024", estatus: "Activo"
  },
  {
    id: "EB-1011", folio: "EB-1011", nombre: "Carlos Rodríguez López",
    fechaNacimiento: "11/08/2013", sexo: "Masculino", curp: "ROLC130811HDFDPR06",
    direccion: "Av. Patriotismo 901, Col. Escandón, CDMX, CP 11800",
    telefonos: ["55 0123 4567"],
    contactoEmergencia: { nombre: "Patricia López Morales", telefono: "55 7878 9090", relacion: "Madre" },
    fechaAlta: "20/03/2024", estatus: "Inactivo"
  },
  {
    id: "EB-1012", folio: "EB-1012", nombre: "María Marías Hernández",
    fechaNacimiento: "05/05/2019", sexo: "Femenino", curp: "MAHM190505MDFRRR01",
    direccion: "Calle 5 de Mayo 123, Col. Centro, CDMX, CP 06000",
    telefonos: ["55 1357 2468", "55 8642 9753"],
    contactoEmergencia: { nombre: "Fernando Marías Díaz", telefono: "55 2468 1357", relacion: "Padre" },
    fechaAlta: "20/03/2024", estatus: "Pendiente"
  },
  {
    id: "EB-1013", folio: "EB-1013", nombre: "Pedro Gómez Ruiz",
    fechaNacimiento: "19/10/2020", sexo: "Masculino", curp: "GORP201019HDFMZD09",
    direccion: "Av. Cuauhtémoc 345, Col. Roma Sur, CDMX, CP 06760",
    telefonos: ["55 2468 0135"],
    contactoEmergencia: { nombre: "Sofía Ruiz Castro", telefono: "55 9753 8642", relacion: "Madre" },
    fechaAlta: "10/05/2024", estatus: "Activo"
  },
];

const HEADERS = ["ID", "Nombre", "Estatus", "Fecha de alta"];

interface Filters  {
  id: number|null,
  nombre: string,
  fecha: string,
  estatus: string
}
type ListaAsociadosProps = {
  onUpdateAsociado?: (index: number, next: AsociadoDetalle) => void,
  filtros: Filters
};

export default function ListaAsociados({
  onUpdateAsociado,
  filtros
}: ListaAsociadosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [RawData, setRawData] = useState<AsociadoDetalle[]>([]);
  const [Data, setData] = useState<AsociadoDetalle[]>([]);

  useEffect(() => {
    const data = async () =>{
      const res = await fetch("/api/asociados/lista_asociados");
      if (res.ok){
        let data = await res.json();
        data = data.filter((element : AsociadoDetalle) => {
          return element.estatus != "Pendiente";
        });
        setRawData(data);
        setData(data);
      }
    }
    data();
  }, [])

  useEffect(() => {
    setData(RawData.filter(element => {
      let idFilter = false;
      let nombreFilter = false;
      let fechaFilter = false;
      let statusFilter = false;
      if (filtros.id == null || filtros.id == 0){
        idFilter = true;
      }
      else if (filtros.id == Number(element.id)){
        idFilter = true;
      }
      if (filtros.nombre == ""){
        nombreFilter = true;
      }
      else if (String(element.nombre).includes(filtros.nombre)){
        nombreFilter = true;
      }
      if (filtros.fecha == ""){
        fechaFilter = true;
      }
      else if (filtros.fecha == String(element.fechaAlta)){
        fechaFilter = true;
      }
      if (filtros.estatus == ""){
        statusFilter = true;
      }
      else if (filtros.estatus == String(element.estatus)){
        statusFilter = true;
      }
      return idFilter && nombreFilter && fechaFilter && statusFilter
    }));
  }, [filtros]);

  const rows = Data.map((row) => ({
    key: row.id,
    cells: [
      row.id,
      row.nombre,
      <span
        key="estatus"
        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColors[row.estatus]}`}
      >
        {row.estatus}
      </span>,
      row.fechaAlta,
    ],
  }));

  const handleClose = () => setSelectedIndex(null);
  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };
  const handleNext = () => {

    if (selectedIndex !== null && selectedIndex < Data.length - 1) {

      setSelectedIndex(selectedIndex + 1);
    }
  };

  const selectedAsociado = selectedIndex !== null ? Data[selectedIndex] : null;

  return (
    <>
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
        <ListaTabla
          headers={HEADERS}
          rows={rows}
          onRowClick={setSelectedIndex}
        />
      </div>
      {selectedAsociado != null && selectedIndex != null && (
        <ModalAsociado
          asociado={selectedAsociado}
          onClose={handleClose}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={selectedIndex < Data.length - 1 ? handleNext : undefined}
          onSave={(next) => {
            if (selectedIndex === null) return;
            onUpdateAsociado?.(selectedIndex, next);
          }}
        />
      )}
    </>
  );
}
