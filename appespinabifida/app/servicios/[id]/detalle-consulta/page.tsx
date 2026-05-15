import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ListItemEstudio from "@/components/ListItemEstudio";
import SolicitarEstudioButton from "@/components/SolicitarEstudioButton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTATUS_CLASSES: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Completado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-rose-100 text-rose-800",
};

function EstatusBadge({ estatus }: { estatus: string }) {
  const cls = ESTATUS_CLASSES[estatus] ?? "bg-slate-100 text-slate-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {estatus}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DetalleConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const res = await fetch(
    `https://sem6-espina-bifida.vercel.app/api/servicios/obtener/consultas/porId?id=${id}`
  );
  const data = await res.json();

  const resEstudios = await fetch(
    `https://sem6-espina-bifida.vercel.app/api/servicios/obtener/estudios/porConsulta?id=${id}`
  );
  const listaEstudios = await resEstudios.json();

  function parseFechaHora(isoString: String) {
  if (!isoString) return { fecha: null, hora: null };

  const [fecha, timePart] = isoString.split('T');
  const hora = timePart ? timePart.replace('Z', '') : null;

  return { fecha, hora };
}

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/servicios"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Servicios
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-800">
              Detalle de consulta
            </h1>
            <span className="text-sm text-slate-500">
              Folio: CON-{data.id_consulta}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            { ((session as any).user as any).role === "admin" || ((session as any).user as any).role === "superadmin" ? (
              
            <Link
              href={`/servicios/${id}/editar-consulta`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-10"
            >
              Editar consulta
            </Link>) : null}
            <SolicitarEstudioButton folioConsulta={`CON-${data.id_consulta}`} defaultAsociadoId={data.id_asociado} />
          </div>
        </div>
      </div>

      {/* Datos generales */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Datos generales
        </h2>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-medium text-sky-700">
            {data.nombre_asociado?.[0]}
            {data.apellidos_asociado?.[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">
              {data.apellidos_asociado ?? "—"}, {data.nombre_asociado ?? "—"}
            </div>
            <div className="text-xs text-slate-500">
              Asociado #{data.id_asociado} · {data.status_asociado}
            </div>
          </div>
        </div>
        <hr className="mb-4 border-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Tipo de consulta
            </span>
            <span className="text-sm text-slate-800">{data.tipo_consulta}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">Estatus</span>
            <EstatusBadge estatus={data.estatus} />
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Médico responsable
            </span>
            <span className="text-sm text-slate-800">{data.nombre_medico}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">Fecha</span>
            <span className="text-sm text-slate-800">{parseFechaHora(data.fecha).fecha}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">Hora</span>
            <span className="text-sm text-slate-800">{parseFechaHora(data.fecha).hora}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Monto de aportación
            </span>
            <span className="text-sm text-slate-800">
              ${data.aportacion} MXN
            </span>
          </div>
        </div>
      </div>

      {/* Diagnóstico y tratamiento */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Diagnóstico y tratamiento
        </h2>
        <div className="mb-4">
          <span className="mb-1.5 block text-xs text-slate-500">
            Diagnóstico
          </span>
          <div className="min-h-[60px] rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200">
            {data.diagnostico}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs text-slate-500">
            Tratamiento indicado
          </span>
          <div className="min-h-[60px] rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200">
            {data.tratamiento}
          </div>
        </div>
      </div>

      {/* Estudios solicitados */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Estudios solicitados desde esta consulta
        </h2>
        <div className="divide-y divide-slate-200">
          {listaEstudios.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">
              Sin estudios solicitados.
            </p>
          ) : (
            listaEstudios.map((item: any, index: number) => (
              <ListItemEstudio key={index} data={item} />
            ))
          )}
        </div>
      </div>

      {/* Recibo vinculado */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recibo vinculado
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm italic text-slate-400">
            Sin recibo vinculado aún.
          </span>
          {/* Vincular recibo - comentado temporalmente
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-9">
            Vincular recibo
          </button>
          */}
        </div>
      </div>

    </div>
  );
}
