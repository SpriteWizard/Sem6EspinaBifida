export type EtapaVida =
  | 'Primera infancia'
  | 'Infancia'
  | 'Adolescencia'
  | 'Jóvenes'
  | 'Adultos'
  | 'Adultos mayores'
  | 'Sin clasificar'

// ── Metric 1 — por CURP ──────────────────────────────────────────────────────

export interface FilaCurp {
  etapa: EtapaVida
  curp_nl: number
  curp_foraneo: number
  total: number
}

export interface PorCurpData {
  filas: FilaCurp[]
  totales: Omit<FilaCurp, 'etapa'>
}

// ── Metric 2 — por residencia ────────────────────────────────────────────────

export interface FilaResidencia {
  etapa: EtapaVida
  nl: number
  otros: number
  total: number
}

export interface PorResidenciaData {
  filas: FilaResidencia[]
  totales: Omit<FilaResidencia, 'etapa'>
}

// ── Metric 3 — por nacimiento ────────────────────────────────────────────────

export interface FilaNacimiento {
  etapa: EtapaVida
  mexicanos: number
  extranjeros: number
  total: number
}

export interface PorNacimientoData {
  filas: FilaNacimiento[]
  totales: Omit<FilaNacimiento, 'etapa'>
}

// ── Metrics 4, 5, 6 — por etapa / CURP NL / CURP foráneo ────────────────────

export interface FilaEtapaSexo {
  etapa: EtapaVida
  total: number
  mujer: number
  hombre: number
}

export interface PorEtapaSexoData {
  filas: FilaEtapaSexo[]
  totales: Omit<FilaEtapaSexo, 'etapa'>
}

// ── Metric 7 — registros por mes ─────────────────────────────────────────────

export interface FilaMes {
  mes: string   // YYYY-MM
  registros: number
}

export interface RegistrosMesData {
  anio: number
  filas: FilaMes[]
  promedio_anual: number
}

// ── Metric 8 — por estado de residencia (mapa coroplético) ───────────────────

export interface FilaEstado {
  estado: string
  total: number
}

export interface PorEstadoData {
  filas: FilaEstado[]
  total_nacional: number
}
