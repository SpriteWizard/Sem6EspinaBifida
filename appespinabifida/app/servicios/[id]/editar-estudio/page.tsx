import EditarEstudioForm from "@/components/EditarEstudioForm";

export default async function EditarEstudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/servicios/obtener/estudios/porId?id=${id}`);

  const data = await res.json();

  return <EditarEstudioForm data={data} />;
}
