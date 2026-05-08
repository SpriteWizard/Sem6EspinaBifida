/** Datos que envía el formulario de preregistro (futuro asociado). */
export type PreregistroRegistroPayload = {
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
  contactoEmergenciaRelacion: string;
  contactoEmergenciaTelefono: string;
  madreNombre: string;
  madreApellidoPaterno: string;
  madreApellidoMaterno: string;
  padreNombre: string;
  padreApellidoPaterno: string;
  padreApellidoMaterno: string;
  antecedentesMedicos: string;
};

export const emptyPreregistroPayload = (): PreregistroRegistroPayload => ({
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
  contactoEmergenciaRelacion: "",
  contactoEmergenciaTelefono: "",
  madreNombre: "",
  madreApellidoPaterno: "",
  madreApellidoMaterno: "",
  padreNombre: "",
  padreApellidoPaterno: "",
  padreApellidoMaterno: "",
  antecedentesMedicos: "",
});
