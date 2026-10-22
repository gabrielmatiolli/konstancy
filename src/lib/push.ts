import "server-only";
import webpush, { WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";

export interface Notificacao {
  titulo: string;
  corpo: string;
  /** Caminho aberto ao tocar na notificação. */
  url: string;
  /** Notificações com a mesma tag substituem a anterior em vez de empilhar. */
  tag?: string;
}

let configurado: boolean | null = null;

function configurar() {
  if (configurado !== null) return configurado;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) {
    console.warn("[push] VAPID não configurado — notificações desativadas.");
    configurado = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_CONTATO || "mailto:contato@example.com", publica, privada);
  configurado = true;
  return true;
}

/**
 * Envia para todos os aparelhos dos usuários informados. Inscrições que o
 * serviço de push declara mortas (404/410 — app desinstalado, permissão
 * revogada) são apagadas. Nunca lança: push é acessório, não pode derrubar a
 * ação que o disparou.
 */
export async function notificar(usuarioIds: string[], notificacao: Notificacao) {
  if (usuarioIds.length === 0 || !configurar()) return;

  const inscricoes = await prisma.inscricaoPush.findMany({ where: { usuarioId: { in: usuarioIds } } });
  const payload = JSON.stringify(notificacao);
  const mortas: string[] = [];

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
          payload,
          { TTL: 60 * 60 * 12, urgency: "normal" },
        );
      } catch (erro) {
        if (erro instanceof WebPushError && (erro.statusCode === 404 || erro.statusCode === 410)) {
          mortas.push(inscricao.id);
        } else {
          console.error("[push] falha ao enviar", erro);
        }
      }
    }),
  );

  if (mortas.length > 0) await prisma.inscricaoPush.deleteMany({ where: { id: { in: mortas } } });
}

/** IDs dos membros da família, menos quem disparou o evento. */
export async function membrosExceto(familiaId: string, exceto: string) {
  const membros = await prisma.membro.findMany({
    where: { familiaId, usuarioId: { not: exceto } },
    select: { usuarioId: true },
  });
  return membros.map((m) => m.usuarioId);
}
