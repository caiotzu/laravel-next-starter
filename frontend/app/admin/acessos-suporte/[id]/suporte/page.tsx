import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/dashboard?acesso_suporte_id=${encodeURIComponent(id)}`);
}
