import Link from "next/link";

const ESTATUS_CLASSES: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Completado: "bg-emerald-100 text-emerald-800",
  Cancelado: "bg-rose-100 text-rose-800",
};

export default function ListItemEstudio({ data }: { data: any }) {
  const cls = ESTATUS_CLASSES[data.estatus] ?? "bg-slate-100 text-slate-800";
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <Link
          href={`/servicios/${data.id_estudio}/detalle-estudio`}
          className="text-sm font-medium text-slate-800 hover:text-sky-700 transition"
        >
          {data.nombre}
        </Link>
        <div className="mt-0.5 text-xs text-slate-500">
          EST-{data.id_estudio} · Solicitado el {data.fecha.split("T")[0]}
        </div>
      </div>
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}
      >
        {data.estatus}
      </span>
    </div>
  );
}
