/** Datos que envía el formulario de preregistro (futuro asociado). */
export type PreregistroRegistroPayload = {
  correo: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  curp: string;
  telefono: string;
  direccionCalleNumero: string;
  direccionCiudad: string;
  direccionEstado: string;
  direccionCp: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  contactoEmergenciaRelacion: string;
  padresMadresNombre: string;
  padresMadresApellidoPaterno: string;
  padresMadresApellidoMaterno: string;
  lugarNacimiento: string;
  hospital: string;
  valvula: string;
  tipoSangre: string;
  antecedentesMedicos: string;
};

export const emptyPreregistroPayload = (): PreregistroRegistroPayload => ({
  correo: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  fechaNacimiento: "",
  sexo: "",
  curp: "",
  telefono: "",
  direccionCalleNumero: "",
  direccionCiudad: "",
  direccionEstado: "",
  direccionCp: "",
  contactoEmergenciaNombre: "",
  contactoEmergenciaTelefono: "",
  contactoEmergenciaRelacion: "",
  padresMadresNombre: "",
  padresMadresApellidoPaterno: "",
  padresMadresApellidoMaterno: "",
  lugarNacimiento: "",
  hospital: "",
  valvula: "",
  tipoSangre: "",
  antecedentesMedicos: "",
});
