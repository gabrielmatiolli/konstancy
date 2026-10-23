import "server-only";
import { prisma } from "@/lib/prisma";
import { selecaoPessoa } from "@/lib/pessoa";
import { deDate, hoje, paraDate } from "@/lib/datas";

/** Campos que o cartão de check-in precisa, já com "eu curti?" do usuário. */
export function selecaoDoCartao(usuarioId: string) {
  return {
    id: true,
    dia: true,
    criadoEm: true,
    descricao: true,
    atividade: true,
    duracaoMin: true,
    largura: true,
    altura: true,
    usuarioId: true,
    usuario: { select: selecaoPessoa },
    curtidas: { where: { usuarioId }, select: { usuarioId: true } },
    _count: { select: { curtidas: true, comentarios: true } },
  } as const;
}

export async function checkinsDaFamilia(familiaId: string, usuarioId: string, de: string, ate: string) {
  return prisma.checkin.findMany({
    where: { familiaId, dia: { gte: paraDate(de), lte: paraDate(ate) } },
    select: selecaoDoCartao(usuarioId),
    orderBy: { criadoEm: "desc" },
  });
}

export type CheckinDoCartao = Awaited<ReturnType<typeof checkinsDaFamilia>>[number];

export async function jaFezCheckinHoje(familiaId: string, usuarioId: string) {
  const n = await prisma.checkin.count({ where: { familiaId, usuarioId, dia: paraDate(hoje()) } });
  return n > 0;
}

/**
 * Regra BeReal: foto de outra pessoa feita hoje fica borrada enquanto quem vê
 * não postou a sua. Aplicada também em /api/fotos — não é só CSS — e nas
 * curtidas/comentários. A tela pede a foto por `?v=borrada` nesse caso.
 */
export function deveBorrar(
  checkin: { dia: Date; usuarioId: string },
  visitante: { id: string; postouHoje: boolean },
  borrarAtePostar: boolean,
) {
  return (
    borrarAtePostar && !visitante.postouHoje && checkin.usuarioId !== visitante.id && deDate(checkin.dia) === hoje()
  );
}
