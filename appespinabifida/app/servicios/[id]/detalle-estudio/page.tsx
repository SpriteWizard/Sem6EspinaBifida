import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImprimirOrdenButton from "../../../components/ImprimirOrdenButton";
import { useSession } from "next-auth/react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABORATORIOS: Record<string, string> = {
  L01: "Lab. Médico Cerrus",
  L02: "Centro de Imagen UDEM",
  L03: "Hospital San José TEC",
  L04: "Laboratorio Clínico Lomas",
  L05: "Diagnóstica del Norte",
};

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

export default async function DetalleEstudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const res = await fetch(
    `https://sem6-espina-bifida.vercel.app/api/servicios/obtener/estudios/porId?id=${id}`
  );
  if (!res.ok) {
    throw new Error(`Estudio no encontrado (id=${id})`);
  }
  const data = await res.json();

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
              Detalle de estudio
            </h1>
            <span className="text-sm text-slate-500">
              Folio: EST-{data.id_estudio}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            { ((session as any).user as any).role === "admin" || ((session as any).user as any).role === "superadmin" ? (
            <Link
              href={`/servicios/${id}/editar-estudio`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-10"
            >
              Editar estudio
            </Link>) : null
            }
            <ImprimirOrdenButton
              estudioId={data.id_estudio}
              nombreAsociado={data.nombre_asociado ?? ""}
              apellidosAsociado={data.apellidos_asociado ?? ""}
              tipoEstudio={data.tipo_estudio ?? ""}
              fecha={data.fecha ?? ""}
              medicoEstudio={data.medico_estudio ?? ""}
            />
          </div>
        </div>
      </div>

      {/* Datos generales */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Datos generales
        </h2>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
            {data.nombre_asociado?.[0]}
            {data.apellidos_asociado?.[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">
              {data.apellidos_asociado ?? "—"}, {data.nombre_asociado ?? "—"}
            </div>
            <div className="text-xs text-slate-500">
              Asociado #{data.id_asociado} · {data.estatus_asociado}
            </div>
          </div>
        </div>
        <hr className="mb-4 border-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Tipo de estudio
            </span>
            <span className="text-sm text-slate-800">{data.tipo_estudio}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">Estatus</span>
            <EstatusBadge estatus={data.estatus} />
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Médico solicitante
            </span>
            <span className="text-sm text-slate-800">{data.medico_estudio}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">Fecha de solicitud</span>
            <span className="text-sm text-slate-800">{parseFechaHora(data.fecha).fecha}</span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Monto de aportación
            </span>
            <span className="text-sm text-slate-800">
              ${data.aportacion} MXN
            </span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Laboratorio
            </span>
            <span className="text-sm text-slate-800">
              {LABORATORIOS[data.laboratorio] ?? data.laboratorio ?? "—"}
            </span>
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-slate-500">
              Ya aportó
            </span>
            <span className={`text-sm font-medium ${data.ya_aporto ? "text-emerald-600" : "text-slate-400"}`}>
              {data.ya_aporto ? "Sí" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notas
        </h2>
        {data.nota ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {data.nota}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">Sin notas registradas.</p>
        )}
      </div>

      {/* Consulta vinculada */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Consulta vinculada
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">
              {data.tipo_consulta} · CON-{data.id_consulta}
            </div>
            <div className="text-xs text-slate-500">
              {data.fecha_consulta} · {data.medico_consulta}
            </div>
          </div>
          <Link
            href={`/servicios/${data.id_consulta}/detalle-consulta`}
            className="text-sm font-medium text-sky-600 hover:text-sky-800 transition"
          >
            Ver consulta ↗
          </Link>
        </div>
      </div>

      {/* Resultados del estudio */}
      <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 px-6 py-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Resultados del estudio
        </h2>
        {data.resultados ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {data.resultados}
          </p>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-400">
              Aún no se han registrado resultados para este estudio.
            </p>
          </div>
        )}
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
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-600 h-9">
            Vincular recibo
          </button>
        </div>
      </div>

    </div>
  );
}
