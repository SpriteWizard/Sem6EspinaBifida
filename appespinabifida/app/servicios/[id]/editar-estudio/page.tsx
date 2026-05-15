"use client";
import EditarEstudioForm from "@/components/EditarEstudioForm";

export default async function EditarEstudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  console.log(`/api/servicios/obtener/estudios/porId?id=${id}`)

  const res = await fetch(`/api/servicios/obtener/estudios/porId?id=${id}`);

  console.log(res);
  const data = await res.json();

  return <EditarEstudioForm data={data} />;
}
