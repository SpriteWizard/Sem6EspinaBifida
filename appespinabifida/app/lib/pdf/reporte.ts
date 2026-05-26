import { jsPDF } from "jspdf"

export interface ReporteData {
  cantCredenciales: number
  cantServicios: number
  exentos: number
  cuota: number
  hombres: number
  mujeres: number
  urbano: number
  rural: number
  lactantes: number
  ninos: number
  adolescentes: number
  adultos: number
  servicios: { cant: number; servicio: string; unidad: string }[]
  ciudades: { cant: number; ciudad: string }[]
  estudios: { cant: number; estudio: string }[]
}

export const MOCK_REPORTE_DATA: ReporteData = {
  cantCredenciales: 1,
  cantServicios: 328,
  exentos: 15,
  cuota: 313,
  hombres: 44,
  mujeres: 53,
  urbano: 86,
  rural: 11,
  lactantes: 9,
  ninos: 27,
  adolescentes: 22,
  adultos: 39,
  servicios: [
    { cant: 1,    servicio: "DENTAL",                          unidad: ""        },
    { cant: 4,    servicio: "UROCULTIVO",                      unidad: ""        },
    { cant: 12,   servicio: "SOLUCION DE CLORURO AL 0.9%",     unidad: "PZA."    },
    { cant: 62,   servicio: "SOLUCION DE CLORURO AL 0.9% 500", unidad: "PZA."    },
    { cant: 160,  servicio: "SONDA NELATON DE PVC #8 \"A\"",   unidad: "PZA."    },
    { cant: 66,   servicio: "SONDA NELATON DE PVC #10 \"A\"",  unidad: "PZA."    },
    { cant: 249,  servicio: "SONDA NELATON DE PVC #12",        unidad: "PZA."    },
    { cant: 1,    servicio: "GAMAGRAMA RENAL \"A\" \"B\"",     unidad: "UNIDAD"  },
    { cant: 50,   servicio: "CONSULTAS UROLOGIA \"A\"",        unidad: "CITA"    },
    { cant: 1,    servicio: "CONSULTAS UROLOGIA \"B\"",        unidad: "CITA"    },
    { cant: 1,    servicio: "ELECTRODOS CUADRADO DE 5x5",      unidad: "UNIDAD"  },
    { cant: 227,  servicio: "SONDA NELATON DE PVC #14 \"A\"",  unidad: "PZA."    },
    { cant: 5,    servicio: "VALCLAN (AMOX./ACIDO CLAV)",      unidad: "PZA."    },
    { cant: 2,    servicio: "IMIPRAMINA 25 MG. CAJA C/20 TAB", unidad: "CAJA"    },
    { cant: 17,   servicio: "SONDA NELATON DE PVC #16 \"A\"",  unidad: "PZA."    },
    { cant: 853,  servicio: "GEL LUBRICANTE SOBRE DE 3",       unidad: "PZA."    },
    { cant: 27,   servicio: "PAÑAL CALZON JUVENIL C/20",       unidad: "PAQ."    },
    { cant: 3,    servicio: "LAMOTRIGINA 100 mg. c/28",        unidad: "CAJA"    },
    { cant: 12,   servicio: "CREDENCIALES RENOVACION 2026",    unidad: "UNIDAD"  },
    { cant: 2670, servicio: "OXIBUTININA 5 MG. \"A\"",         unidad: "PASTILLA"},
  ],
  ciudades: [
    { cant: 1,  ciudad: "ABASOLO"              },
    { cant: 10, ciudad: "APODACA"              },
    { cant: 2,  ciudad: "CADEREYTA JIMENEZ"    },
    { cant: 1,  ciudad: "CAMARGO"              },
    { cant: 1,  ciudad: "CIENEGA DE FLORES"    },
    { cant: 1,  ciudad: "DR. ARROYO"           },
    { cant: 3,  ciudad: "EL CARMEN"            },
    { cant: 5,  ciudad: "ESCOBEDO"             },
    { cant: 4,  ciudad: "GARCIA"               },
    { cant: 1,  ciudad: "GRAL. ZUAZUA"         },
    { cant: 17, ciudad: "GUADALUPE"            },
    { cant: 10, ciudad: "JUAREZ"               },
    { cant: 19, ciudad: "MONTERREY"            },
    { cant: 2,  ciudad: "SALINAS VICTORIA"     },
    { cant: 7,  ciudad: "SAN NICOLAS DE LOS GARZA" },
    { cant: 6,  ciudad: "SANTA CATARINA"       },
  ],
  estudios: [
    { cant: 6, estudio: "URODINAMICO" },
  ],
}

function formatDateES(iso: string): string {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const [y, m, d] = iso.split("-")
  return `${d}/${months[parseInt(m) - 1]}./${y.slice(2)}`
}

function drawTable(
  doc: jsPDF,
  x: number,
  startY: number,
  colWidths: number[],
  headers: string[],
  rows: (string | number)[][],
  rowH = 5,
): number {
  const totalW = colWidths.reduce((a, b) => a + b, 0)
  doc.setLineWidth(0.2)
  doc.setDrawColor(0, 0, 0)

  // Header
  doc.setFillColor(220, 220, 220)
  doc.rect(x, startY, totalW, rowH, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  let cx = x
  for (let i = 0; i < headers.length; i++) {
    doc.rect(cx, startY, colWidths[i], rowH)
    const align = i === 0 ? "left" : i === headers.length - 1 ? "left" : "right"
    if (align === "right") {
      doc.text(headers[i], cx + colWidths[i] - 1, startY + rowH - 1.5, { align: "right" })
    } else {
      doc.text(headers[i], cx + 1, startY + rowH - 1.5)
    }
    cx += colWidths[i]
  }

  let curY = startY + rowH
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)

  for (const row of rows) {
    cx = x
    for (let i = 0; i < row.length; i++) {
      doc.rect(cx, curY, colWidths[i], rowH)
      const val = String(row[i])
      // Cant column right-aligned, others left-aligned
      if (i === 0) {
        doc.text(val, cx + colWidths[i] - 1, curY + rowH - 1.5, { align: "right" })
      } else {
        const maxW = colWidths[i] - 2
        const truncated = doc.splitTextToSize(val, maxW)[0] ?? val
        doc.text(truncated, cx + 1, curY + rowH - 1.5)
      }
      cx += colWidths[i]
    }
    curY += rowH
  }

  return curY
}

export async function generarReportePDF(
  from: string,
  to: string,
  data: ReporteData,
  logoBase64?: string | null,
): Promise<string> {
  const doc = new jsPDF({ format: "a4", unit: "mm", orientation: "portrait" })

  const PW = 210
  const ML = 10
  const MR = 10
  const MT = 10
  const CW = PW - ML - MR  // 190

  const fromLabel = formatDateES(from)
  const toLabel = formatDateES(to)
  const today = formatDateES(new Date().toISOString().slice(0, 10))

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const LOGO_W = 28
  const LOGO_H = 20

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", ML, MT, LOGO_W, LOGO_H)
  } else {
    doc.setFillColor(0, 60, 100)
    doc.rect(ML, MT, LOGO_W, LOGO_H, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)
    doc.text("ESPINA\nBÍFIDA", ML + LOGO_W / 2, MT + LOGO_H / 2 - 1, { align: "center" })
  }

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Resumen de Período", PW / 2, MT + 8, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`del  ${fromLabel}  al  ${toLabel}`, PW / 2, MT + 15, { align: "center" })

  doc.setFontSize(8)
  doc.text(today, ML + CW, MT + 8, { align: "right" })

  // Separator
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(ML, MT + 24, ML + CW, MT + 24)

  // ── RESUMEN DE SERVICIOS ─────────────────────────────────────────────────────
  let y = MT + 30

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Resumen de Servicios", PW / 2, y, { align: "center" })

  doc.setLineWidth(0.3)
  doc.line(ML, y + 2, ML + CW, y + 2)

  y += 8

  const labelW = 30
  const valW = 14
  const gap = 4

  // Column x positions (5 logical groups)
  const C1 = ML
  const C2 = C1 + labelW + valW + gap
  const C3 = C2 + 22 + valW + gap
  const C4 = C3 + 22 + valW + gap
  const C5 = C4 + 18 + valW + gap

  function drawLabelVal(label: string, val: number | string, lx: number, ly: number, lw = labelW) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.text(label, lx, ly)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const lbW = doc.getTextWidth(label)
    doc.setLineWidth(0.2)
    doc.line(lx + lbW + 1, ly + 0.8, lx + lbW + valW, ly + 0.8)
    doc.text(String(val), lx + lbW + 2, ly)
  }

  // Row 1
  drawLabelVal("Cant. Credenciales", data.cantCredenciales, C1, y)
  drawLabelVal("Exentos", data.exentos, C2, y, 18)
  drawLabelVal("Hombres", data.hombres, C3, y, 18)
  drawLabelVal("Urbano", data.urbano, C4, y, 16)
  drawLabelVal("Lactantes", data.lactantes, C5, y, 22)

  // Row 2
  y += 7
  drawLabelVal("Cant. Servicios", data.cantServicios, C1, y)
  drawLabelVal("Cuota", data.cuota, C2, y, 18)
  drawLabelVal("Mujeres", data.mujeres, C3, y, 18)
  drawLabelVal("Rural", data.rural, C4, y, 16)
  drawLabelVal("Niños", data.ninos, C5, y, 22)

  y += 7
  drawLabelVal("Adolescentes", data.adolescentes, C5, y, 22)

  y += 7
  drawLabelVal("Adultos", data.adultos, C5, y, 22)

  // Separator
  y += 6
  doc.setLineWidth(0.5)
  doc.line(ML, y, ML + CW, y)

  // ── DETALLE ──────────────────────────────────────────────────────────────────
  y += 5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Detalle", PW / 2, y, { align: "center" })

  doc.setLineWidth(0.3)
  doc.line(ML, y + 2, ML + CW, y + 2)

  y += 6

  // Layout: left table takes ~57% width, right takes ~40%
  const LEFT_W = 108
  const RIGHT_X = ML + LEFT_W + 4
  const RIGHT_W = CW - LEFT_W - 4  // ~78mm

  // Column widths for each table
  const svcCols = [10, LEFT_W - 10 - 22, 22]   // Cant | Servicio | Unidad
  const citCols = [10, RIGHT_W - 10]             // Cant | Ciudad
  const estCols = [10, RIGHT_W - 10]             // Cant | Estudios

  const ROW_H = 4.5

  const svcRows = data.servicios.map((s) => [s.cant, s.servicio, s.unidad])
  const citRows = data.ciudades.map((c) => [c.cant, c.ciudad])
  const estRows = data.estudios.map((e) => [e.cant, e.estudio])

  // Left — Servicios
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Servicios", ML + 1, y + 3)

  drawTable(doc, ML, y, svcCols, ["Cant.", "Servicios", "Unidad"], svcRows, ROW_H)

  // Right top — Ciudades
  const citEndY = drawTable(
    doc,
    RIGHT_X,
    y,
    citCols,
    ["Cant.", "Ciudad"],
    citRows,
    ROW_H,
  )

  // Right bottom — Estudios (with small gap)
  const estStartY = citEndY + 3
  drawTable(
    doc,
    RIGHT_X,
    estStartY,
    estCols,
    ["Cant.", "Estudios"],
    estRows,
    ROW_H,
  )

  const blob = doc.output("blob")
  return URL.createObjectURL(blob)
}
