import EditarConsultaForm from "@/components/EditarConsultaForm";

export default async function EditarConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/servicios/obtener/consultas/porId?id=${id}`)
  const data = await res.json();

  return <EditarConsultaForm id ={id} data={data} />;
}
