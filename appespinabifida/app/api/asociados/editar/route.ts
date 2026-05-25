type Estatus = "Activo" | "Inactivo" | "Pendiente";
type Sexo = "Masculino" | "Femenino";

type FormState = {
  id: string;
  fechaAlta: string;
  nombre: string;
  apellidos: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
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
  foto: string;
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
};

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
  foto?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

function mapDetalleToForm(a: AsociadoDetalle): FormState {
  const [t0, t1, t2] = a.telefonos ?? [];
  return {
    id: a.id ?? "",
    fechaAlta: a.fechaAlta ?? "",
    nombre: a.nombre ?? "",
    apellidoPaterno: a.apellidoPaterno ?? "",
    apellidoMaterno: a.apellidoMaterno ?? "",
    apellidos: `${a.apellidoPaterno ?? ""} ${a.apellidoMaterno ?? ""}`.trim(),
    curp: a.curp ?? "",
    fechaNacimiento: a.fechaNacimiento ?? "",
    edad: a.edad ?? "",
    sexo: a.sexo ?? "Femenino",
    estatus: a.estatus ?? "Activo",

    nombrePadreMadre: a.nombrePadreMadre ?? "",
    etapaVida: a.etapaVida ?? "",

    vive: a.vive === true ? "si" : "no",

    fechaUltRecibo: a.fechaUltRecibo ?? "",

    direccion: a.direccion ?? "",
    ciudad: a.ciudad ?? "",
    estado: a.estado ?? "",
    cp: a.cp ?? "",

    telCasa: a.telCasa ?? t0 ?? "",
    telTrabajo: a.telTrabajo ?? t1 ?? "",
    telCel: a.telCel ?? t2 ?? t1 ?? t0 ?? "",

    correo: a.correo ?? "",

    contactoNombre: a.contactoEmergencia?.nombre ?? "",
    contactoTelefono: a.contactoEmergencia?.telefono ?? "",
    contactoRelacion: a.contactoEmergencia?.relacion ?? "",

    vigenciaDesde: a.vigenciaDesde ?? "",
    vigenciaHasta: a.vigenciaHasta ?? "",

    fotoUrl: a.fotoUrl ?? "",

    lugarNacimiento: a.lugarNacimiento ?? "",
    hospital: a.hospital ?? "",
    padecimiento: a.padecimiento ?? "",
    tipoSangre: a.tipoSangre ?? "",

    valvula: a.valvula ? "si" : "no",
    controlUrologico: a.controlUrologico ? "si" : "no",

    lugarControlUrologico: a.lugarControlUrologico ?? "",

    fechaGralOrina: a.fechaGralOrina ?? "",
    fechaEcoRenal: a.fechaEcoRenal ?? "",
    fechaEstUrodinamico: a.fechaEstUrodinamico ?? "",
    fechaTacCerebro: a.fechaTacCerebro ?? "",
    fechaUrocultivo: a.fechaUrocultivo ?? "",
    fechaUroTac: a.fechaUroTac ?? "",
    fechaUltEstUro: a.fechaUltEstUro ?? "",
    fechaOtrosEstudios: a.fechaOtrosEstudios ?? "",
    foto: a.foto ?? "",

    madreLugarNacimiento: a.madreLugarNacimiento ?? "",
    madreEscolaridad: a.madreEscolaridad ?? "",
    madreEdad: a.madreEdad?.toString?.() ?? "",
    madreOcupacion: a.madreOcupacion ?? "",
    madreParentescoConPareja: a.madreParentescoConPareja ? "si" : "no",
    madreCdInicioEmbarazo: a.madreCdInicioEmbarazo ?? "",
    madreAcidoFolicoAntesDuranteEmbarazo: a.madreAcidoFolicoAntesDuranteEmbarazo ? "si" : "no",
    madreCantidadCitasControlPrenatal: a.madreCantidadCitasControlPrenatal ?? "",
    madreSeguro: a.madreSeguro ?? "",

    padreLugarNacimiento: a.padreLugarNacimiento ?? "",
    padreEscolaridad: a.padreEscolaridad ?? "",
    padreEdad: a.padreEdad?.toString?.() ?? "",
    padreOcupacion: a.padreOcupacion ?? "",
    padreParentescoConPareja: a.padreParentescoConPareja ? "si" : "no",
    padreSeguro: a.padreSeguro ?? "",

    adiccionesAmbos: a.adiccionesAmbos ?? "",
    otroHijoConDTN: a.otroHijoConDTN ? "si" : "no",
    familiarConDTN: a.familiarConDTN ? "si" : "no",
    exposicionToxicosEmbarazo: a.exposicionToxicosEmbarazo ? "si" : "no",
    descripcionToxinas: a.descripcionToxinas ?? "",
  };
}


export async function POST(request: Request){
    const body = await request.json();
    const data = mapDetalleToForm(body);

    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/editarAsociado",{
        method:"POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(data),
    });
    if (res.ok){
        return Response.json({status: "ok"})
    }

    return Response.json({status: "fail"});
}