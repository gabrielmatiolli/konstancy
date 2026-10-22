"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";
import { notificar } from "@/lib/push";

const esquema = z.object({
  endpoint: z.url().max(500),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

/** Grava (ou reatribui) a inscrição deste aparelho ao usuário logado. */
export async function salvarInscricao(inscricao: unknown, userAgent?: string) {
  const usuario = await exigirUsuario();
  const dados = esquema.parse(inscricao);
  const campos = {
    usuarioId: usuario.id,
    p256dh: dados.keys.p256dh,
    auth: dados.keys.auth,
    userAgent: userAgent?.slice(0, 255) ?? null,
  };
  // Upsert por endpoint: o mesmo aparelho pode trocar de conta (celular compartilhado).
  await prisma.inscricaoPush.upsert({
    where: { endpoint: dados.endpoint },
    create: { endpoint: dados.endpoint, ...campos },
    update: campos,
  });
}

export async function removerInscricao(endpoint: string) {
  const usuario = await exigirUsuario();
  await prisma.inscricaoPush.deleteMany({ where: { endpoint, usuarioId: usuario.id } });
}

export async function enviarPushDeTeste() {
  const usuario = await exigirUsuario();
  await notificar([usuario.id], {
    titulo: "Notificações ligadas ✅",
    corpo: "Você vai saber quando a família fizer check-in.",
    url: "/perfil",
  });
}
