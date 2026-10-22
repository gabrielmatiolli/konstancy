import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { usuarioLogado } from "@/lib/auth";
import { normalizarCodigo } from "@/lib/familia";

/**
 * Link de convite compartilhado no WhatsApp. Logado: entra na família na hora.
 * Deslogado: vai para o cadastro com o código preenchido.
 */
export default async function PaginaConvite({ params }: PageProps<"/convite/[codigo]">) {
  const codigo = normalizarCodigo((await params).codigo);
  const familia = await prisma.familia.findUnique({ where: { codigoConvite: codigo }, select: { id: true } });
  if (!familia) notFound();

  const usuario = await usuarioLogado();
  if (!usuario) redirect(`/cadastro?codigo=${codigo}`);

  await prisma.membro.upsert({
    where: { usuarioId_familiaId: { usuarioId: usuario.id, familiaId: familia.id } },
    create: { usuarioId: usuario.id, familiaId: familia.id },
    update: {},
  });
  await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaAtivaId: familia.id } });
  redirect("/");
}
