'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
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

function estatusRecibo(pagado: number, _total: number) {
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
  membresias: Membresia[];
}

// ─── subcomponentes ───────────────────────────────────────────────────────────

const MAX_ROWS = 5;

// Altura exacta para mostrar thead + 5 filas antes de hacer scroll
// py-2.5 (10+10) + text-sm line-height (~20px) = ~40px por fila
const SCROLL_MAX_H = 'max-h-[260px]';

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
      <div className="rounded-t-2xl border-b border-slate-200 bg-slate-50 px-4 py-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">{title}</span>
        {hint && (
          <div className="relative group">
            <Info className="h-3.5 w-3.5 text-slate-400 cursor-default" />
            <div className="absolute left-0 top-5 z-20 w-56 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg hidden group-hover:block">
              {hint}
            </div>
          </div>
        )}
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

export function DashboardClient({ rol }: { rol: string }) {
  const router = useRouter();
  const canClick = rol === 'superadmin' || rol === 'admin';
  const [fecha, setFecha] = useState(todayISO());

  // TODO backend: reemplazar con useEffect + fetch(`/api/dashboard?fecha=${fecha}`)

  const [baseData, setbaseData] = useState<DashboardData>(EMPTY_DATA);
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [preregistros, setPreregistros] = useState<Preregistro[]>([]);
  const [inventario, setInventario] = useState<ArticuloInventario[]>([]);

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
      const res = await fetch('/api/asociados/preRegistro/lista?estatus=Pendiente&limit=100');
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
        setData(EMPTY_DATA);
      }
    })();

  }, []);

  useEffect(() => {
    const allDates = baseData as any;
    const filteredData = allDates[formatDate(fecha)];
    if (filteredData != null) setData(filteredData);
    else setData(EMPTY_DATA);

    const firstDate = Object.keys(allDates)[0];
    if (firstDate) {
      const order: Record<string, number> = { low_stock: 0, out_of_stock: 1 };
      const sorted = [...(allDates[firstDate].inventario ?? [])].sort(
        (a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2)
      );
      setInventario(sorted);
    }
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
        <SectionCard title="Consultas del día" hint={canClick ? "Haz clic en una consulta para ver su detalle." : undefined}>
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
                      <tr key={c.id} className={`h-11 transition${canClick ? ' cursor-pointer hover:bg-slate-50' : ''}`} onClick={canClick ? () => router.push(`/servicios/${c.id}/detalle-consulta`) : undefined}>
                        <td className="px-4 py-2.5 text-slate-700">{c.hora}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{c.asociado}</td>
                        <td className="px-4 py-2.5 text-slate-700">{c.servicio ? c.servicio.charAt(0).toUpperCase() + c.servicio.slice(1) : ''}</td>
                        <td className="px-4 py-2.5 text-slate-700">Dr. {c.medico}</td>
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
          <SectionCard title="Recibos por vencer" hint={canClick ? "Haz clic en un recibo para ir a registrar su pago." : undefined}>
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
                        <tr key={r.id} className={`h-11 transition${canClick ? ' cursor-pointer hover:bg-slate-50' : ''}`} onClick={canClick ? () => router.push(`/recibos?desglose=${r.id}`) : undefined}>
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

          <SectionCard title="Alertas de inventario" hint={canClick ? "Haz clic en un artículo para registrar una entrada de inventario." : undefined}>
            <TableWrapper count={inventario.length}>
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
                  {inventario.length === 0 ? (
                    <EmptyRow cols={4} />
                  ) : (
                    inventario.map((i) => {
                      const est = estatusStock(i.status);
                      return (
                        <tr key={i.id} className={`h-11 transition${canClick ? ' cursor-pointer hover:bg-slate-50' : ''}`} onClick={canClick ? () => router.push(`/inventory/movimientos?entrada=${i.id}&nombre=${encodeURIComponent(i.name)}`) : undefined}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{i.name}</td>
                          <td className="px-4 py-2.5 text-slate-700">{i.categoryName ? i.categoryName.charAt(0).toUpperCase() + i.categoryName.slice(1) : ''}</td>
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
                      <tr key={m.id} className="h-11">
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

          <SectionCard title="Preregistros pendientes" hint={canClick ? "Haz clic en un preregistro para aceptarlo o rechazarlo." : undefined}>
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
                      <tr key={p.id} className={`h-11 transition${canClick ? ' cursor-pointer hover:bg-slate-50' : ''}`} onClick={canClick ? () => router.push(`/asociados?preregistro=${p.id}`) : undefined}>
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

const EMPTY_DATA: DashboardData = {
  consultas: [],
  recibos: [],
  membresias: [],
};
