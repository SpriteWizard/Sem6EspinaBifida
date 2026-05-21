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
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/obtenerListaPreRegistro`,
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

  let lista = response.map((asociado: any) => {
    const telephone_list = JSON.parse(asociado.telefonos ?? "[]");
    const fechaSolicitud = splitDate(asociado.fecha_alta);

    return {
      id:             asociado.id_asociado,
      folio:          "PR-" + asociado.id_asociado,
      nombre:         asociado.nombre + (asociado.apellidos ? " " + asociado.apellidos : ""),
      fechaSolicitud,
      fechaNacimiento: splitDate(asociado.fecha_nacimiento),
      sexo:           asociado.sexo,
      curp:           asociado.curp,
      correo:         asociado.correo,
      telefono:       telephone_list[0]?.telefono ?? "",
      nombrePadreMadre: asociado.nombre_tutor ?? "",
      direccion:      asociado.calle,
      ciudad:         asociado.ciudad,
      estado:         asociado.estado,
      cp:             asociado.cp,
      contactoEmergencia: {
        nombre:   asociado.nombre_emergencia,
        telefono: asociado.numero_emergencia,
        relacion: asociado.parentesco_emergencia,
      },
      estatus:        sentenceCase(asociado.activo) as "Pendiente" | "Anulado",
      lugarNacimiento: asociado.lugar_nacimiento,
      hospital:       asociado.hospital,
      padecimiento:   JSON.parse(asociado.padecimientos ?? "[]").filter(Boolean).join(", "),
      tipoSangre:     asociado.tipo_sangre,
      valvula:        Number(asociado.tiene_valvula) === 1,
      notaanulacion:  asociado.notaanulacion,
    };
  });

  if (filterId > 0) {
    lista = lista.filter((p: any) => Number(p.id) === filterId);
  }
  if (filterNombre) {
    lista = lista.filter((p: any) =>
      String(p.nombre).toLowerCase().includes(filterNombre)
    );
  }
  if (filterFecha) {
    lista = lista.filter((p: any) => p.fechaSolicitud === filterFecha);
  }
  if (filterEstatus) {
    lista = lista.filter((p: any) => p.estatus === filterEstatus);
  }

  const page = lista.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < lista.length ? String(cursor + limit) : null;

  return Response.json({ items: page, nextCursor });
}
