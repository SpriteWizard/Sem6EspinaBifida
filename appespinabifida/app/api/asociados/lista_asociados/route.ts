function splitDate(raw: any): string {
  if (!raw) return "";
  return String(raw).split("T")[0];
}

function sentenceCase(text: any): string | null {
  if (!text) return null;
  return String(text)[0].toUpperCase() + String(text).slice(1);
}

function parseCursor(value: string | null): number {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.floor(n);
}

function parseLimit(value: string | null): number {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return 5;
  return Math.min(Math.floor(n), 100);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = parseCursor(searchParams.get("cursor"));
  const limit = parseLimit(searchParams.get("limit"));
  const filterNombre = (searchParams.get("nombre") ?? "").toLowerCase();
  const filterEstatus = searchParams.get("estatus") ?? "";
  const filterId = Number(searchParams.get("id") ?? "0") || 0;
  const filterFecha = searchParams.get("fecha") ?? "";

  const res = await fetch(
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/obtenerListaAsociados`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
      },
    }
  );

  if (!res.ok) {
    console.error("Oracle error:", res.status, await res.text());
    return Response.json({ items: [], nextCursor: null }, { status: 500 });
  }

  const response = (await res.json()).items;

  let lista = response.map((a: any) => {
    const telephone_list: any[] = JSON.parse(a.telefonos ?? "[]");
    const padecimientos: string[] = JSON.parse(a.padecimientos ?? "[]");

    return {
      id:                   a.id_asociado,
      folio:                "ASO-" + a.id_asociado,
      nombre:               a.nombre,
      apellidoPaterno:      a.apellido_paterno,
      apellidoMaterno:      a.apellido_materno,
      fechaNacimiento:      splitDate(a.fecha_nacimiento),
      sexo:                 a.sexo,
      curp:                 a.curp,
      correo:               a.correo,
      nombrePadreMadre:     a.nombre_tutor,
      direccion:            a.calle,
      ciudad:               a.ciudad,
      estado:               a.estado,
      cp:                   a.cp,
      fechaAlta:            splitDate(a.fecha_alta),
      fechaUltRecibo:       splitDate(a.fecha_ult_recibo),
      vigenciaDesde:        splitDate(a.vigencia_desde),
      vigenciaHasta:        splitDate(a.vigencia_hasta),
      estatus:              sentenceCase(a.activo),
      telefonos:            telephone_list.map((t: any) => t.telefono),
      telCasa:              a.telefono_casa,
      telTrabajo:           telephone_list.find((t: any) => t.tipo === "trabajo")?.telefono ?? "",
      telCel:               telephone_list.find((t: any) => t.tipo === "cel")?.telefono ?? "",
      contactoEmergencia: {
        nombre:   a.nombre_emergencia,
        telefono: a.numero_emergencia,
        relacion: a.parentesco_emergencia,
      },
      lugarNacimiento:      a.lugar_nacimiento,
      hospital:             a.hospital,
      padecimiento:         padecimientos.filter(Boolean).join(", "),
      tipoSangre:           a.tipo_sangre,
      valvula:              Number(a.tiene_valvula) === 1,
      controlUrologico:     Number(a.control_urologico) === 1,
      lugarControlUrologico: a.lugar_control_urologico,
      vive:                 Number(a.vive) === 1,
      edad:                 a.edad !== null && a.edad !== undefined ? String(a.edad) : "",
      etapaVida:            a.etapa_vida ?? "",
      madreLugarNacimiento:               a.madre_lugar_nacimiento,
      madreEscolaridad:                   a.madre_escolaridad,
      madreEdad:                          a.madre_edad,
      madreOcupacion:                     a.madre_ocupacion,
      madreParentescoConPareja:           Boolean(a.madre_parentesco_entre_pareja),
      madreCdInicioEmbarazo:              a.madre_ciudad_inicio_embarazo,
      madreAcidoFolicoAntesDuranteEmbarazo: Boolean(a.madre_acido_folico),
      madreCantidadCitasControlPrenatal:  a.madre_citas_control_prenatal,
      madreSeguro:                        a.madre_seguro,
      padreLugarNacimiento:               a.padre_lugar_nacimiento,
      padreEscolaridad:                   a.padre_escolaridad,
      padreEdad:                          a.padre_edad,
      padreOcupacion:                     a.padre_ocupacion,
      padreParentescoConPareja:           Boolean(a.padre_parentesco_entre_pareja),
      padreSeguro:                        a.padre_seguro,
      adiccionesAmbos:                    a.adicciones_ambos,
      otroHijoConDTN:                     Boolean(a.otro_hijo_dtn),
      familiarConDTN:                     Boolean(a.familiar_dtn),
      exposicionToxicosEmbarazo:          Boolean(a.exposicion_toxicos_embarazo),
      descripcionToxinas:                 a.descripcion_toxinas,
      fechaGralOrina: a.fecha_ult_gral_orina ? splitDate(a.fecha_ult_gral_orina) : "—",
      fechaEcoRenal: a.fecha_ult_eco_renal ? splitDate(a.fecha_ult_eco_renal) : "—",
      fechaEstUrodinamico: a.fecha_ult_est_urodinamico ? splitDate(a.fecha_ult_est_urodinamico) : "—",
      fechaTacCerebro: a.fecha_ult_tac_cerebro ? splitDate(a.fecha_ult_tac_cerebro) : "—",
      fechaUrocultivo: a.fecha_ult_urocultivo ? splitDate(a.fecha_ult_urocultivo) : "—",
      fechaUroTac: a.fecha_ult_urotac ? splitDate(a.fecha_ult_urotac) : "—",
      fechaUltEstUro: a.fecha_ult_est_uro ? splitDate(a.fecha_ult_est_uro) : "—",
      fechaOtrosEstudios: a.fecha_ult_otros ? splitDate(a.fecha_ult_otros) : "—",
    };
  });

  // Exclude Pendiente and Anulado from the asociados list
  lista = lista.filter((a: any) => a.estatus !== "Pendiente" && a.estatus !== "Anulado");

  if (filterId > 0) {
    lista = lista.filter((a: any) => Number(a.id) === filterId);
  }
  if (filterNombre) {
    lista = lista.filter((a: any) => {
      const full = [a.nombre, a.apellidoPaterno, a.apellidoMaterno]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return full.includes(filterNombre);
    });
  }
  if (filterFecha) {
    lista = lista.filter((a: any) => a.fechaAlta === filterFecha);
  }
  if (filterEstatus) {
    lista = lista.filter((a: any) => a.estatus === filterEstatus);
  }

  const page = lista.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < lista.length ? String(cursor + limit) : null;

  return Response.json({ items: page, nextCursor });
}
