export async function GET(){
    const res = await fetch(`https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/obtenerListaPreRegistro`,{
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
      }
    });
    const response = (await res.json()).items;
    const ListaAsociados = response.map((asociado: any) => {
        
        function sentenceCase(text: String){
            if (text == null) return null;
            return text[0].toUpperCase() + text.slice(1);
        }
        const [birthDate, timeWithZ] = String(asociado.fecha_nacimiento).split("T");
        const [fechaAlta, _] = String(asociado.fecha_alta).split("T");
        const telephone_list = JSON.parse(asociado.telefonos);
        return {
            id: asociado.id_asociado,
            folio: "ASO-" + asociado.id_asociado,
            nombre: asociado.nombre + " "+ asociado.apellidos,
            fechaNacimiento: birthDate,
            sexo: asociado.sexo,
            curp: asociado.curp,
            direccion: asociado.calle + ", " + asociado.ciudad + ", " + asociado.estado + ", " + asociado.cp,
            ciudad: asociado.ciudad,
            estado:asociado.estado,
            cp:asociado.cp,
            telefonos: telephone_list.map((telefono: any) => telefono.telefono),
            contactoEmergencia: { nombre: asociado.nombre_emergencia, telefono: asociado.numero_emergencia, relacion: asociado.parentesco_emergencia },
            fechaAlta: fechaAlta,
            estatus: sentenceCase(asociado.activo),
            lugarNacimiento: asociado.lugar_nacimiento,
            hospital: asociado.hospital,
            padecimiento: JSON.parse(asociado.padecimientos).join(", "),
            valvula: Number(asociado.tiene_valvula) == 1,
            controlUrologico: false,
            madreLugarNacimiento: asociado.madre_lugar_nacimiento,
            madreEscolaridad: asociado.madre_escolaridad,
            madreEdad: asociado.madre_edad,
            madreOcupacion: asociado.madre_ocupacion,
            madreParentescoConPareja: asociado.madre_parentesco_entre_pareja,
            madreCdInicioEmbarazo: asociado.madre_ciudad_inicio_embarazo,
            madreAcidoFolicoAntesDuranteEmbarazo: asociado.madre_acido_folico,
            madreCantidadCitasControlPrenatal: asociado.madre_citas_control_prenatal,
            madreSeguro: asociado.madre_seguro,
            padreLugarNacimiento: asociado.padre_lugar_nacimiento,
            padreEscolaridad: asociado.padre_escolaridad,
            padreEdad: asociado.padre_edad,
            padreOcupacion: asociado.padre_ocupacion,
            padreParentescoConPareja: asociado.padre_parentesco_entre_pareja,
            padreSeguro: asociado.padre_seguro,
            otroHijoConDTN: asociado.otro_hijo_dtn,
            familiarConDTN: asociado.familiar_dtn,
            exposicionToxicosEmbarazo: asociado.exposicion_toxicos_embarazo,
            notaanulacion: asociado.notaanulacion
        };
    })

    return Response.json(ListaAsociados);
}