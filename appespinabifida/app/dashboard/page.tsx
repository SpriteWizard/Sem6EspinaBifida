import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  CreditCard,
  IdCard,
  Package,
  Phone,
  Stethoscope,
} from "lucide-react";

import { authOptions } from "@/lib/auth-options";
import { Badge } from "../components/ui/Badge";

// Mock data
const HOY = "2026-05-28";

const membresiasVencenHoy = [
  { id: 142, nombre: "María Fernanda López", folio: "ASO-142", tel: "81 1234 5678", vigenciaHasta: HOY },
  { id: 87, nombre: "Juan Carlos Ramírez", folio: "ASO-087", tel: "81 9876 5432", vigenciaHasta: HOY },
  { id: 203, nombre: "Sofía Martínez Ruiz", folio: "ASO-203", tel: "81 4455 6677", vigenciaHasta: HOY },
];

const recibosVencenHoy = [
  { id: 5012, asociado: "Pedro Hernández", montoTotal: 1200, montoPagado: 0, fechaLimite: HOY },
  { id: 5018, asociado: "Ana Gómez Salas", montoTotal: 850, montoPagado: 400, fechaLimite: HOY },
  { id: 5023, asociado: "Luis Ortega Vega", montoTotal: 2300, montoPagado: 2300, fechaLimite: HOY },
];

const consultasDelDia = [
  { id: 901, hora: "09:00", paciente: "Diego Salinas", servicio: "Consulta neurología", medico: "Dra. Pérez", estatus: "Confirmada" as const },
  { id: 902, hora: "10:30", paciente: "Valentina Reyes", servicio: "Terapia física", medico: "Dr. Morales", estatus: "En espera" as const },
  { id: 903, hora: "12:00", paciente: "Mateo Cárdenas", servicio: "Consulta urología", medico: "Dra. Hernández", estatus: "Confirmada" as const },
  { id: 904, hora: "16:00", paciente: "Camila Núñez", servicio: "Valoración psicológica", medico: "Lic. Torres", estatus: "Cancelada" as const },
];

const inventarioBajoStock = [
  { id: "INV-014", articulo: "Sondas Foley 14F", categoria: "Insumo médico", stock: 0, minimo: 20 },
  { id: "INV-022", articulo: "Guantes nitrilo M", categoria: "Protección", stock: 3, minimo: 30 },
  { id: "INV-031", articulo: "Gasas estériles 10x10", categoria: "Curación", stock: 8, minimo: 25 },
  { id: "INV-045", articulo: "Cateterismo intermitente", categoria: "Insumo médico", stock: 0, minimo: 15 },
];

const registrosPendientes = [
  { id: "REG-3301", tipo: "Alta de asociado", solicitante: "Recepción", fecha: "2026-05-26" },
  { id: "REG-3308", tipo: "Validación de pago", solicitante: "Caja", fecha: "2026-05-27" },
  { id: "REG-3312", tipo: "Expediente clínico", solicitante: "Trabajo social", fecha: "2026-05-28" },
];

function formatMoneda(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function estatusRecibo(pagado: number, total: number) {
  if (pagado <= 0) return { label: "Pendiente", variant: "failed" as const };
  if (pagado >= total) return { label: "Pagado", variant: "success" as const };
  return { label: "Parcial", variant: "warning" as const };
}

function estatusConsulta(estatus: "Confirmada" | "En espera" | "Cancelada") {
  if (estatus === "Confirmada") return { label: estatus, variant: "success" as const };
  if (estatus === "En espera") return { label: estatus, variant: "warning" as const };
  return { label: estatus, variant: "failed" as const };
}

function estatusStock(stock: number) {
  if (stock <= 0) return { label: "Sin stock", variant: "failed" as const };
  return { label: "Bajo stock", variant: "warning" as const };
}

function fechaLarga(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen  px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-md  text-slate-500">
            <span className="capitalize ">{fechaLarga(HOY)}</span>
          </div>
        </header>

        {/* Servicios de hoy (consultas) */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 px-5 py-4 bg-slate-600">
            <h2 className="text-base font-bold text-white">Servicios de hoy (consultas)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-sm bg-slate-600 text-white">
                <tr>
                  <th className="px-5 py-3 font-semibold">Hora</th>
                  <th className="px-5 py-3 font-semibold">Paciente</th>
                  <th className="px-5 py-3 font-semibold">Servicio</th>
                  <th className="px-5 py-3 font-semibold">Médico</th>
                  <th className="px-5 py-3 font-semibold">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consultasDelDia.map((c) => {
                  const est = estatusConsulta(c.estatus);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{c.hora}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{c.paciente}</td>
                      <td className="px-5 py-3 text-slate-600">{c.servicio}</td>
                      <td className="px-5 py-3 text-slate-600">{c.medico}</td>
                      <td className="px-5 py-3">
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recibos que vencen hoy */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 px-5 py-4 bg-slate-600">
            <h2 className="text-base font-bold text-white">Recibos que vencen hoy</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-sm bg-slate-600 text-white">
                <tr>
                  <th className="px-5 py-3 font-semibold">Folio</th>
                  <th className="px-5 py-3 font-semibold">Asociado</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Pagado</th>
                  <th className="px-5 py-3 font-semibold">Fecha límite</th>
                  <th className="px-5 py-3 font-semibold">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recibosVencenHoy.map((r) => {
                  const est = estatusRecibo(r.montoPagado, r.montoTotal);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">REC-{r.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{r.asociado}</td>
                      <td className="px-5 py-3 text-slate-600">{formatMoneda(r.montoTotal)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatMoneda(r.montoPagado)}</td>
                      <td className="px-5 py-3 text-slate-600">{r.fechaLimite}</td>
                      <td className="px-5 py-3">
                        <Badge variant={est.variant}>{est.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Inventario bajo / sin stock */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 px-5 py-4 bg-slate-600">
            <h2 className="text-base font-bold text-white">Inventario bajo / sin stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-sm bg-slate-600 text-white">
                <tr>
                  <th className="px-5 py-3 font-semibold">Clave</th>
                  <th className="px-5 py-3 font-semibold">Artículo</th>
                  <th className="px-5 py-3 font-semibold">Categoría</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Mínimo</th>
                  <th className="px-5 py-3 font-semibold">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventarioBajoStock.map((i) => {
                  const est = estatusStock(i.stock);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{i.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{i.articulo}</td>
                      <td className="px-5 py-3 text-slate-600">{i.categoria}</td>
                      <td className="px-5 py-3 text-slate-600">{i.stock}</td>
                      <td className="px-5 py-3 text-slate-600">{i.minimo}</td>
                      <td className="px-5 py-3">
                        <Badge variant={est.variant}>{est.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Membresías por vencer */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 px-5 py-4 bg-slate-600">
            <h2 className="text-base font-bold text-white">Membresías por vencer</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-sm bg-slate-600 text-white">
                <tr>
                  <th className="px-5 py-3 font-semibold">Folio</th>
                  <th className="px-5 py-3 font-semibold">Asociado</th>
                  <th className="px-5 py-3 font-semibold">Teléfono</th>
                  <th className="px-5 py-3 font-semibold">Vigencia hasta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membresiasVencenHoy.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.folio}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{m.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        
                        {m.tel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{m.vigenciaHasta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Registros pendientes */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 px-5 py-4 bg-slate-600">
            <h2 className="text-base font-bold text-white">Registros pendientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-sm bg-slate-600 text-white">
                <tr>
                  <th className="px-5 py-3 font-semibold">Folio</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Solicitante</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 font-semibold">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrosPendientes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.tipo}</td>
                    <td className="px-5 py-3 text-slate-600">{r.solicitante}</td>
                    <td className="px-5 py-3 text-slate-600">{r.fecha}</td>
                    <td className="px-5 py-3">
                      <Badge variant="warning">
                        <span className="inline-flex items-center gap-1">
                          Pendiente
                        </span>
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
