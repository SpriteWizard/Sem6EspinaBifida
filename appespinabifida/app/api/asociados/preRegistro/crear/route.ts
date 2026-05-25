export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

    const payload = {
      ...body,
      fechaAlta: fechaHoy,
      apellidos: [body.apellidoPaterno, body.apellidoMaterno]
        .filter(Boolean)
        .join(" "),
      direccion: body.direccionCalleNumero,
      ciudad: body.direccionCiudad,
      estado: body.direccionEstado,
      cp: body.direccionCp,
      telCel: body.telefono,
      contactoNombre: body.contactoEmergenciaNombre,
      contactoTelefono: body.contactoEmergenciaTelefono,
      contactoRelacion: body.contactoEmergenciaRelacion,
      nombrePadreMadre: [
        body.padresMadresNombre,
        body.padresMadresApellidoPaterno,
        body.padresMadresApellidoMaterno,
      ]
        .filter(Boolean)
        .join(" "),
      padecimiento: body.antecedentesMedicos,
      estatus: "Pendiente",
    };

    const res = await fetch(
      "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/agregarAsociado",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Basic " +
            Buffer.from(
              `${process.env.DB_USER}:${process.env.DB_PASSWORD}`
            ).toString("base64"),
        },
        body: JSON.stringify(payload),
      }
    );

    const responseBody = await res.text();

    if (res.ok) {
      return new Response(
        JSON.stringify({ ok: true, result: responseBody }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const isDuplicateCurp = responseBody.includes("ORA-00001") || responseBody.includes("UQ_ASOCIADO_CURP_ACTIVO");

    if (isDuplicateCurp) {
      try {
        const listaRes = await fetch(
          "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/asociados/obtenerListaAsociados",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
            },
          }
        );
        if (listaRes.ok) {
          const listaData = await listaRes.json();
          const curp = (body.curp ?? "").toUpperCase();
          const existente = (listaData.items ?? []).find(
            (a: any) => (a.curp ?? "").toUpperCase() === curp
          );
          const activo = (existente?.activo ?? "").toLowerCase();
          if (activo === "pendiente") {
            return new Response(
              JSON.stringify({ ok: false, reason: "curp_pendiente" }),
              { status: 409, headers: { "Content-Type": "application/json" } }
            );
          }
          if (activo === "activo" || activo === "inactivo") {
            return new Response(
              JSON.stringify({ ok: false, reason: "curp_asociado" }),
              { status: 409, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      } catch {}
      return new Response(
        JSON.stringify({ ok: false, reason: "curp_duplicado" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("ORDS preregistro error:", responseBody);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to create preregistro" }),
      { status: res.status, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in preregistro crear endpoint:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
