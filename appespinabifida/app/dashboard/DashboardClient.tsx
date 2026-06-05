'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge } from '../components/ui/Badge';

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fechaLarga(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoneda(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function estatusRecibo(pagado: number, total: number) {
  if (pagado <= 0) return { label: 'Pendiente', variant: 'failed' as const };
  return { label: 'Parcial', variant: 'warning' as const };
}

function estatusConsulta(e: Consulta['estatus']) {
  if (e === 'Completado')  return { label: e, variant: 'success' as const };
  if (e === 'En proceso')  return { label: e, variant: 'warning' as const };
  if (e === 'Pendiente')   return { label: e, variant: 'warning' as const };
  return { label: e, variant: 'failed' as const };
}

function estatusStock(status: ArticuloInventario['status']) {
  if (status === 'out_of_stock') return { label: 'Sin stock', variant: 'failed' as const };
  return { label: 'Bajo stock', variant: 'warning' as const };
}

// ─── types ────────────────────────────────────────────────────────────────────

export interface Consulta {
  id: number;
  hora: string;
  asociado: string;
  servicio: string;
  medico: string;
  estatus: 'Pendiente' | 'En proceso' | 'Completado' | 'Cancelado';
}

export interface Recibo {
  id: number;
  asociado: string;
  montoTotal: number;
  montoPagado: number;
  fechaLimite: string;
}

export interface ArticuloInventario {
  id: number;
  name: string;
  categoryName: string;
  quantity: number;
  stockMinimo: number;
  status: 'in_stock' | 'out_of_stock' | 'low_stock';
}

export interface Membresia {
  id: string;
  nombre: string;
  folio: string;
  telefono: string;
  vigenciaHasta: string;
}

export interface Preregistro {
  id: string;
  nombre: string;
  fechaSolicitud: string;
}

export interface DashboardData {
  consultas: Consulta[];
  recibos: Recibo[];
  inventario: ArticuloInventario[];
  membresias: Membresia[];
}

// ─── subcomponentes ───────────────────────────────────────────────────────────

const MAX_ROWS = 5;

// Altura exacta para mostrar thead + 5 filas antes de hacer scroll
// py-2.5 (10+10) + text-sm line-height (~20px) = ~40px por fila
const SCROLL_MAX_H = 'max-h-[260px]';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
      <div className="rounded-t-2xl border-b border-slate-200 bg-slate-50 px-4 py-2">
        <span className="text-sm font-semibold text-slate-600">{title}</span>
      </div>
      {children}
    </div>
  );
}

function TableWrapper({ count, children }: { count: number; children: React.ReactNode }) {
  if (count > MAX_ROWS) {
    return (
      <div className={`${SCROLL_MAX_H} overflow-y-auto overflow-x-auto`}>
        {children}
      </div>
    );
  }
  return <div className="overflow-x-auto">{children}</div>;
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-6 text-center text-sm text-slate-400">
        Sin registros para esta fecha
      </td>
    </tr>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export function DashboardClient() {
  const [fecha, setFecha] = useState(todayISO());

  // TODO backend: reemplazar con useEffect + fetch(`/api/dashboard?fecha=${fecha}`)

  const [baseData, setbaseData] = useState<DashboardData>(EMPTY_DATA);
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [preregistros, setPreregistros] = useState<Preregistro[]>([]);

  const recibosPendientes = data.recibos.filter((r) => r.montoPagado < r.montoTotal);

  function formatDate(dateStr: string) {
    if (dateStr.includes("/")) return dateStr; // ya está en formato MM/DD/YYYY
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
  }

  // Preregistros NO dependen de la fecha — son todos los pendientes de aprobación
  // TODO backend: reemplazar con useEffect + fetch('/api/preregistros/pendientes')
  useEffect(() => {
    (async()=> {
      const res = await fetch('/api/asociados/preRegistro/lista');
      if (res.ok) {
        const data = (await res.json()).items;
        const preregistros = data.map((p: any) => {
          return {
          id: p.id,
          nombre: p.nombre,
          fechaSolicitud: p.fechaSolicitud
        }});
        setPreregistros(preregistros);
      }
    })();

    (async()=>{
      const res = await fetch("/api/inicio/obtener")
      if (res.ok){
        const data = await res.json();
        if (data.message == "Success"){
          setbaseData(data.data);
        }
        setData( EMPTY_DATA);
      }
    })()
  }, []);

  useEffect(() => {
    const filteredData = (baseData as any)[formatDate(fecha)];
    if (filteredData != null) setData(filteredData);
    else setData(EMPTY_DATA);
  },[fecha,baseData])

  return (
    <main className="min-h-screen px-4 py-4 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-3">

        {/* Encabezado */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-800">Inicio</h1>
            <p className="mt-0.5 text-base capitalize text-slate-500">{fechaLarga(fecha)}</p>
          </div>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </header>

        {/* Fila 1: Consultas del día */}
        <SectionCard title="Consultas del día">
          <TableWrapper count={data.consultas.length}>
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-600 text-white">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Hora</th>
                  <th className="px-4 py-2.5 font-semibold">Paciente</th>
                  <th className="px-4 py-2.5 font-semibold">Servicio</th>
                  <th className="px-4 py-2.5 font-semibold">Médico</th>
                  <th className="px-4 py-2.5 font-semibold">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.consultas.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  data.consultas.map((c) => {
                    const est = estatusConsulta(c.estatus);
                    return (
                      <tr key={c.id} className="h-11 cursor-pointer transition hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">{c.hora}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{c.asociado}</td>
                        <td className="px-4 py-2.5 text-slate-700">{c.servicio}</td>
                        <td className="px-4 py-2.5 text-slate-700">{c.medico}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={est.variant}>{est.label}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableWrapper>
        </SectionCard>

        {/* Fila 2: Recibos | Inventario */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <SectionCard title="Recibos por vencer">
            <TableWrapper count={recibosPendientes.length}>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-600 text-white">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Folio</th>
                    <th className="px-4 py-2.5 font-semibold">Asociado</th>
                    <th className="px-4 py-2.5 font-semibold">Total</th>
                    <th className="px-4 py-2.5 font-semibold">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recibosPendientes.length === 0 ? (
                    <EmptyRow cols={4} />
                  ) : (
                    recibosPendientes.map((r) => {
                      const est = estatusRecibo(r.montoPagado, r.montoTotal);
                      return (
                        <tr key={r.id} className="h-11 cursor-pointer transition hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700">REC-{r.id}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{r.asociado}</td>
                          <td className="px-4 py-2.5 text-slate-700">{formatMoneda(r.montoTotal)}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={est.variant}>{est.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </SectionCard>

          <SectionCard title="Alertas de inventario">
            <TableWrapper count={data.inventario.length}>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-600 text-white">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Artículo</th>
                    <th className="px-4 py-2.5 font-semibold">Categoría</th>
                    <th className="px-4 py-2.5 font-semibold">Stock</th>
                    <th className="px-4 py-2.5 font-semibold">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.inventario.length === 0 ? (
                    <EmptyRow cols={4} />
                  ) : (
                    data.inventario.map((i) => {
                      const est = estatusStock(i.status);
                      return (
                        <tr key={i.id} className="h-11 cursor-pointer transition hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{i.name}</td>
                          <td className="px-4 py-2.5 text-slate-700">{i.categoryName}</td>
                          <td className="px-4 py-2.5 text-slate-700">{i.quantity} / {i.stockMinimo}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={est.variant}>{est.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </SectionCard>
        </div>

        {/* Fila 3: Membresías | Preregistros */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <SectionCard title="Membresías por vencer">
            <TableWrapper count={data.membresias.length}>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-600 text-white">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Folio</th>
                    <th className="px-4 py-2.5 font-semibold">Nombre</th>
                    <th className="px-4 py-2.5 font-semibold">Teléfono</th>
                    <th className="px-4 py-2.5 font-semibold">Vence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.membresias.length === 0 ? (
                    <EmptyRow cols={4} />
                  ) : (
                    data.membresias.map((m) => (
                      <tr key={m.id} className="h-11 cursor-pointer transition hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">{m.folio}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{m.nombre}</td>
                        <td className="px-4 py-2.5 text-slate-700">{m.telefono}</td>
                        <td className="px-4 py-2.5 text-slate-700">{m.vigenciaHasta}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </SectionCard>

          <SectionCard title="Preregistros pendientes">
            <TableWrapper count={preregistros.length}>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-600 text-white">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Nombre</th>
                    <th className="px-4 py-2.5 font-semibold">Fecha de solicitud</th>
                    <th className="px-4 py-2.5 font-semibold">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {preregistros.length === 0 ? (
                    <EmptyRow cols={3} />
                  ) : (
                    preregistros.map((p) => (
                      <tr key={p.id} className="h-11 cursor-pointer transition hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{p.nombre}</td>
                        <td className="px-4 py-2.5 text-slate-700">{p.fechaSolicitud}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="warning">Pendiente</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </SectionCard>
        </div>

      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA — reemplazar con llamadas al API cuando el backend esté listo
// ═══════════════════════════════════════════════════════════════════════════════

const EMPTY_DATA: DashboardData = {
  consultas: [],
  recibos: [],
  inventario: [],
  membresias: [],
};

// Preregistros pendientes: lista global, no depende de la fecha seleccionada.
// TODO backend: reemplazar con GET /api/preregistros/pendientes
const MOCK_PREREGISTROS_PENDIENTES: Preregistro[] = [
  { id: 'PRE-001', nombre: 'Carlos Mendoza Ruiz',   fechaSolicitud: '2026-05-29' },
  { id: 'PRE-002', nombre: 'Daniela Flores Vega',   fechaSolicitud: '2026-05-30' },
  { id: 'PRE-003', nombre: 'Joaquín Torres Ávila',  fechaSolicitud: '2026-05-30' },
  { id: 'PRE-004', nombre: 'Paola Ríos Herrera',    fechaSolicitud: '2026-05-31' },
  { id: 'PRE-005', nombre: 'Simón Aguilera Díaz',   fechaSolicitud: '2026-05-31' },
  { id: 'PRE-006', nombre: 'Valeria Ortega Cruz',   fechaSolicitud: '2026-06-01' },
  { id: 'PRE-007', nombre: 'Emilio Navarro Gil',    fechaSolicitud: '2026-06-01' },
  { id: 'PRE-008', nombre: 'Sofía Medina Leal',     fechaSolicitud: '2026-06-01' },
  { id: 'PRE-009', nombre: 'Ana Beatriz Ortega',    fechaSolicitud: '2026-06-01' },
  { id: 'PRE-010', nombre: 'Luis Fernando Ríos',    fechaSolicitud: '2026-06-02' },
  { id: 'PRE-011', nombre: 'Gabriela Soto Peña',    fechaSolicitud: '2026-06-02' },
];

const MOCK_BY_DATE: Record<string, DashboardData> = {
  '2026-06-01': {
    consultas: [
      { id: 901, hora: '09:00', asociado: 'Diego Salinas',    servicio: 'Consulta neurología',    medico: 'Dr. Pérez',      estatus: 'Completado' },
      { id: 902, hora: '10:30', asociado: 'Valentina Reyes',  servicio: 'Terapia física',          medico: 'Dr. Morales',    estatus: 'En proceso' },
      { id: 903, hora: '12:00', asociado: 'Mateo Cárdenas',   servicio: 'Consulta urología',       medico: 'Dr. Hernández',  estatus: 'Pendiente'  },
      { id: 904, hora: '13:00', asociado: 'Renata Escobar',   servicio: 'Terapia ocupacional',     medico: 'Lic. Ramírez',   estatus: 'Pendiente'  },
      { id: 905, hora: '14:30', asociado: 'Tomás Guerrero',   servicio: 'Consulta neurología',     medico: 'Dr. Pérez',      estatus: 'Pendiente'  },
      { id: 906, hora: '15:00', asociado: 'Camila Núñez',     servicio: 'Valoración psicológica',  medico: 'Lic. Torres',    estatus: 'Cancelado'  },
      { id: 907, hora: '16:30', asociado: 'Rodrigo Fuentes',  servicio: 'Terapia física',          medico: 'Dr. Morales',    estatus: 'Pendiente'  },
    ],
    recibos: [
      { id: 5012, asociado: 'Pedro Hernández',  montoTotal: 1200, montoPagado: 0,   fechaLimite: '2026-06-01' },
      { id: 5018, asociado: 'Ana Gómez Salas',  montoTotal: 850,  montoPagado: 400, fechaLimite: '2026-06-01' },
      { id: 5019, asociado: 'Jorge Castillo',   montoTotal: 2100, montoPagado: 0,   fechaLimite: '2026-06-01' },
      { id: 5020, asociado: 'Rebeca Salinas',   montoTotal: 600,  montoPagado: 200, fechaLimite: '2026-06-01' },
      { id: 5021, asociado: 'Fernando Delgado', montoTotal: 1500, montoPagado: 750, fechaLimite: '2026-06-01' },
      { id: 5022, asociado: 'Mariana Ibáñez',   montoTotal: 900,  montoPagado: 0,   fechaLimite: '2026-06-01' },
    ],
    inventario: [
      { id: 14, name: 'Sondas Foley 14F',        categoryName: 'Insumo médico', quantity: 0,  stockMinimo: 20, status: 'out_of_stock' },
      { id: 22, name: 'Guantes nitrilo M',        categoryName: 'Protección',    quantity: 3,  stockMinimo: 30, status: 'low_stock'    },
      { id: 31, name: 'Gasas estériles 10x10',    categoryName: 'Curación',      quantity: 8,  stockMinimo: 25, status: 'low_stock'    },
      { id: 45, name: 'Cateterismo intermitente', categoryName: 'Insumo médico', quantity: 0,  stockMinimo: 15, status: 'out_of_stock' },
      { id: 52, name: 'Alcohol isopropílico',     categoryName: 'Higiene',       quantity: 2,  stockMinimo: 10, status: 'low_stock'    },
      { id: 60, name: 'Jeringas 5ml',             categoryName: 'Insumo médico', quantity: 4,  stockMinimo: 50, status: 'low_stock'    },
      { id: 71, name: 'Vendas elásticas 10cm',    categoryName: 'Curación',      quantity: 5,  stockMinimo: 40, status: 'low_stock'    },
    ],
    membresias: [
      { id: '142', nombre: 'María Fernanda López', folio: 'ASO-142', telefono: '81 1234 5678', vigenciaHasta: '2026-06-01' },
      { id: '87',  nombre: 'Juan Carlos Ramírez',  folio: 'ASO-087', telefono: '81 9876 5432', vigenciaHasta: '2026-06-01' },
      { id: '55',  nombre: 'Elena Vargas Mora',    folio: 'ASO-055', telefono: '81 5566 7788', vigenciaHasta: '2026-06-01' },
      { id: '201', nombre: 'Ricardo Peña Castro',  folio: 'ASO-201', telefono: '81 2233 4455', vigenciaHasta: '2026-06-01' },
      { id: '178', nombre: 'Claudia Soto Reyes',   folio: 'ASO-178', telefono: '81 6677 8800', vigenciaHasta: '2026-06-01' },
      { id: '34',  nombre: 'Ernesto Luna Vega',    folio: 'ASO-034', telefono: '81 9988 7766', vigenciaHasta: '2026-06-01' },
    ],
  },

  '2026-06-02': {
    consultas: [
      { id: 910, hora: '08:30', asociado: 'Roberto Fuentes',   servicio: 'Terapia ocupacional',    medico: 'Lic. Ramírez', estatus: 'Completado' },
      { id: 911, hora: '11:00', asociado: 'Isabella Castillo', servicio: 'Consulta neurología',    medico: 'Dr. Pérez',    estatus: 'En proceso' },
      { id: 912, hora: '13:30', asociado: 'Emilio Vargas',     servicio: 'Valoración psicológica', medico: 'Lic. Torres',  estatus: 'Pendiente'  },
      { id: 913, hora: '15:00', asociado: 'Fernanda Cruz',     servicio: 'Terapia física',         medico: 'Dr. Morales',  estatus: 'Pendiente'  },
    ],
    recibos: [
      { id: 5031, asociado: 'Marco Leal',    montoTotal: 1800, montoPagado: 900, fechaLimite: '2026-06-02' },
      { id: 5032, asociado: 'Karla Mendoza', montoTotal: 500,  montoPagado: 0,   fechaLimite: '2026-06-02' },
      { id: 5033, asociado: 'Armando Vega',  montoTotal: 2400, montoPagado: 0,   fechaLimite: '2026-06-02' },
    ],
    inventario: [
      { id: 31, name: 'Gasas estériles 10x10',    categoryName: 'Curación',      quantity: 8, stockMinimo: 25, status: 'low_stock'    },
      { id: 45, name: 'Cateterismo intermitente', categoryName: 'Insumo médico', quantity: 0, stockMinimo: 15, status: 'out_of_stock' },
      { id: 52, name: 'Alcohol isopropílico',     categoryName: 'Higiene',       quantity: 2, stockMinimo: 10, status: 'low_stock'    },
    ],
    membresias: [
      { id: '203', nombre: 'Sofía Martínez Ruiz', folio: 'ASO-203', telefono: '81 4455 6677', vigenciaHasta: '2026-06-02' },
      { id: '117', nombre: 'Omar Jiménez Peña',   folio: 'ASO-117', telefono: '81 3322 1100', vigenciaHasta: '2026-06-02' },
    ],
  },

  '2026-06-03': {
    consultas: [
      { id: 920, hora: '09:00', asociado: 'Lucía Mendoza',   servicio: 'Terapia física',         medico: 'Dr. Morales',   estatus: 'Completado' },
      { id: 921, hora: '10:00', asociado: 'Andrés Peña',     servicio: 'Consulta urología',      medico: 'Dr. Hernández', estatus: 'Cancelado'  },
      { id: 922, hora: '11:30', asociado: 'Natalia Ríos',    servicio: 'Consulta neurología',    medico: 'Dr. Pérez',     estatus: 'Completado' },
      { id: 923, hora: '13:00', asociado: 'Carlos Ibarra',   servicio: 'Terapia ocupacional',    medico: 'Lic. Ramírez',  estatus: 'En proceso' },
      { id: 924, hora: '14:30', asociado: 'Patricia Luna',   servicio: 'Valoración psicológica', medico: 'Lic. Torres',   estatus: 'Pendiente'  },
      { id: 925, hora: '16:00', asociado: 'Héctor Guzmán',   servicio: 'Terapia física',         medico: 'Dr. Morales',   estatus: 'Pendiente'  },
      { id: 926, hora: '17:00', asociado: 'Irene Castañeda', servicio: 'Consulta neurología',    medico: 'Dr. Pérez',     estatus: 'Pendiente'  },
    ],
    recibos: [
      { id: 5040, asociado: 'Héctor Guzmán',   montoTotal: 3200, montoPagado: 0,    fechaLimite: '2026-06-03' },
      { id: 5041, asociado: 'Irene Castañeda', montoTotal: 750,  montoPagado: 375,  fechaLimite: '2026-06-03' },
      { id: 5042, asociado: 'Pablo Montoya',   montoTotal: 1100, montoPagado: 0,    fechaLimite: '2026-06-03' },
      { id: 5043, asociado: 'Ximena Rueda',    montoTotal: 1800, montoPagado: 900,  fechaLimite: '2026-06-03' },
      { id: 5044, asociado: 'Bernardo Lara',   montoTotal: 600,  montoPagado: 0,    fechaLimite: '2026-06-03' },
      { id: 5045, asociado: 'Cecilia Mora',    montoTotal: 2500, montoPagado: 1000, fechaLimite: '2026-06-03' },
    ],
    inventario: [
      { id: 14, name: 'Sondas Foley 14F', categoryName: 'Insumo médico', quantity: 0, stockMinimo: 20, status: 'out_of_stock' },
      { id: 60, name: 'Jeringas 5ml',     categoryName: 'Insumo médico', quantity: 4, stockMinimo: 50, status: 'low_stock'    },
    ],
    membresias: [
      { id: '310', nombre: 'Héctor Guzmán Torres', folio: 'ASO-310', telefono: '81 7788 9900', vigenciaHasta: '2026-06-03' },
      { id: '88',  nombre: 'Laura Aguilar',         folio: 'ASO-088', telefono: '81 3344 5566', vigenciaHasta: '2026-06-03' },
      { id: '99',  nombre: 'Jorge Navarro',         folio: 'ASO-099', telefono: '81 6677 8899', vigenciaHasta: '2026-06-03' },
      { id: '412', nombre: 'Sandra Cuevas',         folio: 'ASO-412', telefono: '81 1122 3344', vigenciaHasta: '2026-06-03' },
      { id: '77',  nombre: 'Roberto Leal Díaz',     folio: 'ASO-077', telefono: '81 9900 1122', vigenciaHasta: '2026-06-03' },
      { id: '258', nombre: 'Alejandra Quintero',    folio: 'ASO-258', telefono: '81 4433 2211', vigenciaHasta: '2026-06-03' },
      { id: '333', nombre: 'Martín Espinoza',       folio: 'ASO-333', telefono: '81 8877 6655', vigenciaHasta: '2026-06-03' },
    ],
  },
};
