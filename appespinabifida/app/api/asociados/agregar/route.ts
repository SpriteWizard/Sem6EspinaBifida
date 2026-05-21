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
export async function POST(request: Request){
    const body : FormState = (await request.json());

    // fotoUrl es un blob URL del cliente, no se manda a Oracle
    const { fotoUrl, ...payload } = body as any;

    const res = await fetch("https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/agregarAsociado",{
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
        },
        body: JSON.stringify(payload),
    });

    if (res.ok){
        return Response.json({ status: "ok" });
    } else {
        const errorText = await res.text();
        console.error("Oracle agregarAsociado error:", res.status, errorText);
        return Response.json({ status: "fail", reason: errorText });
    }
}