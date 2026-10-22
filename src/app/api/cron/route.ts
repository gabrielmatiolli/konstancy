import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { calcularPlacar } from "@/lib/desafios";
import { hoje, paraDate } from "@/lib/datas";
import { notificar } from "@/lib/push";

/**
 * Tarefas agendadas, chamadas pelo cron da Hostinger (ver README):
 *   /api/cron?tarefa=lembrete  — fim de tarde: avisa quem ainda não treinou hoje
 *   /api/cron?tarefa=encerrar  — madrugada: fecha desafios vencidos e anuncia o vencedor
 * Autenticação por `Authorization: Bearer <CRON_SEGREDO>` ou `?chave=`.
 */
export async function GET(request: Request) {
  if (!autorizado(request)) return new Response("Não autorizado", { status: 401 });

  const tarefa = new URL(request.url).searchParams.get("tarefa");
  if (tarefa === "lembrete") return Response.json(await lembrete());
  if (tarefa === "encerrar") return Response.json(await encerrarDesafios());
  return new Response("Tarefa desconhecida", { status: 400 });
}

function autorizado(request: Request) {
  const segredo = process.env.CRON_SEGREDO;
  if (!segredo) return false;
  const url = new URL(request.url);
  const recebido =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("chave") ?? "";
  const a = Buffer.from(recebido);
  const b = Buffer.from(segredo);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function lembrete() {
  const dia = paraDate(hoje());
  const familias = await prisma.familia.findMany({
    select: {
      id: true,
      membros: { select: { usuarioId: true } },
      checkins: { where: { dia }, select: { usuarioId: true }, distinct: ["usuarioId"] },
    },
  });

  const avisados = new Set<string>();
  for (const f of familias) {
    const treinaram = new Set(f.checkins.map((c) => c.usuarioId));
    const faltam = f.membros.map((m) => m.usuarioId).filter((id) => !treinaram.has(id) && !avisados.has(id));
    if (faltam.length === 0) continue;
    faltam.forEach((id) => avisados.add(id));
    await notificar(faltam, {
      titulo: "Ainda dá tempo! ⏰",
      corpo:
        treinaram.size > 0
          ? `${treinaram.size} de ${f.membros.length} da família já treinaram hoje. Falta você!`
          : "Ninguém da família treinou hoje ainda. Puxa o bonde!",
      url: "/checkin/novo",
      tag: "lembrete",
    });
  }
  return { avisados: avisados.size };
}

async function encerrarDesafios() {
  const vencidos = await prisma.desafio.findMany({
    where: { encerradoEm: null, dataFim: { lt: paraDate(hoje()) } },
  });

  for (const desafio of vencidos) {
    const placar = await calcularPlacar(desafio);
    const vencedores = placar.linhas.filter((l) => placar.lideres.includes(l.usuarioId)).map((l) => l.nome);

    // Marca antes de notificar: se o push falhar, não reenvia amanhã.
    await prisma.desafio.update({ where: { id: desafio.id }, data: { encerradoEm: new Date() } });

    const membros = await prisma.membro.findMany({ where: { familiaId: desafio.familiaId }, select: { usuarioId: true } });
    await notificar(
      membros.map((m) => m.usuarioId),
      {
        titulo: `🏆 ${desafio.titulo} terminou!`,
        corpo: vencedores.length
          ? `${vencedores.join(" e ")} ${vencedores.length > 1 ? "empataram" : "venceu"} — prêmio: ${desafio.premio}`
          : "Ninguém fez check-in no período.",
        url: `/desafios/${desafio.id}`,
      },
    );
  }
  return { encerrados: vencidos.length };
}
