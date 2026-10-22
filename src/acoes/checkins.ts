"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";
import { ehMembro, exigirFamilia } from "@/lib/familia";
import { apagarFotos, caminhoDaMedia, salvarFoto } from "@/lib/fotos";
import { hoje, paraDate } from "@/lib/datas";
import { membrosExceto, notificar } from "@/lib/push";
import { deveBorrar, jaFezCheckinHoje } from "@/lib/consultas";
import type { EstadoDoForm } from "@/acoes/estado";

const esquema = z.object({
  descricao: z.string().trim().max(500, "Descrição longa demais (máx. 500).").optional(),
  atividade: z.string().trim().max(40).optional(),
  duracaoMin: z.coerce.number().int().min(1).max(1440).optional().or(z.literal("").transform(() => undefined)),
});

export async function criarCheckin(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const { usuario, familia } = await exigirFamilia();

  const foto = form.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return { erro: "Tire ou escolha uma foto." };

  const dados = esquema.safeParse({
    descricao: form.get("descricao") ?? undefined,
    atividade: form.get("atividade") ?? undefined,
    duracaoMin: form.get("duracaoMin") ?? undefined,
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };

  // O id nasce antes do registro para nomear o arquivo da foto.
  const id = randomUUID();
  const dia = hoje();

  let salva;
  try {
    salva = await salvarFoto(foto, id, dia);
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível salvar a foto." };
  }

  try {
    await prisma.checkin.create({
      data: {
        id,
        usuarioId: usuario.id,
        familiaId: familia.id,
        dia: paraDate(dia),
        ...salva,
        descricao: dados.data.descricao || null,
        atividade: dados.data.atividade || null,
        duracaoMin: dados.data.duracaoMin ?? null,
      },
    });
  } catch (erro) {
    await apagarFotos(salva.fotoPath, caminhoDaMedia(salva.fotoPath), salva.thumbPath);
    throw erro;
  }

  after(async () => {
    const corpo = [dados.data.atividade, dados.data.descricao].filter(Boolean).join(" · ") || "Bora treinar também?";
    await notificar(await membrosExceto(familia.id, usuario.id), {
      titulo: `${usuario.nome} fez check-in 💪`,
      corpo,
      url: `/checkin/${id}`,
      tag: `checkin-${id}`,
    });
  });

  revalidatePath("/", "layout");
  redirect(`/checkin/${id}`);
}

export async function apagarCheckin(checkinId: string) {
  const usuario = await exigirUsuario();
  const checkin = await prisma.checkin.findUnique({ where: { id: checkinId } });
  if (!checkin || checkin.usuarioId !== usuario.id) return;

  await prisma.checkin.delete({ where: { id: checkinId } });
  await apagarFotos(checkin.fotoPath, caminhoDaMedia(checkin.fotoPath), checkin.thumbPath);
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Curtidas e comentários
// ---------------------------------------------------------------------------

/** Check-in de uma família do usuário e já liberado para ele (não borrado pelo modo BeReal). */
async function checkinVisivel(checkinId: string, usuarioId: string) {
  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { id: true, usuarioId: true, familiaId: true, dia: true, familia: { select: { borrarAtePostar: true } } },
  });
  if (!checkin || !(await ehMembro(usuarioId, checkin.familiaId))) return null;
  const visitante = { id: usuarioId, postouHoje: await jaFezCheckinHoje(checkin.familiaId, usuarioId) };
  if (deveBorrar(checkin, visitante, checkin.familia.borrarAtePostar)) return null;
  return checkin;
}

export async function alternarCurtida(checkinId: string): Promise<{ curtido: boolean; total: number }> {
  const usuario = await exigirUsuario();
  const checkin = await checkinVisivel(checkinId, usuario.id);
  if (!checkin) throw new Error("Check-in não encontrado.");

  const chave = { checkinId_usuarioId: { checkinId, usuarioId: usuario.id } };
  const existente = await prisma.curtida.findUnique({ where: chave });
  if (existente) {
    await prisma.curtida.delete({ where: chave });
  } else {
    await prisma.curtida.create({ data: { checkinId, usuarioId: usuario.id } });
    if (checkin.usuarioId !== usuario.id) {
      after(() =>
        notificar([checkin.usuarioId], {
          titulo: `${usuario.nome} curtiu seu check-in ❤️`,
          corpo: "Toque para ver.",
          url: `/checkin/${checkinId}`,
          tag: `curtida-${checkinId}`,
        }),
      );
    }
  }

  const total = await prisma.curtida.count({ where: { checkinId } });
  revalidatePath("/", "layout");
  return { curtido: !existente, total };
}

export async function comentar(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const checkinId = String(form.get("checkinId") ?? "");
  const texto = z.string().trim().min(1).max(500).safeParse(form.get("texto"));
  if (!texto.success) return { erro: "Escreva um comentário (até 500 caracteres)." };

  const checkin = await checkinVisivel(checkinId, usuario.id);
  if (!checkin) return { erro: "Check-in não encontrado." };

  await prisma.comentario.create({ data: { checkinId, usuarioId: usuario.id, texto: texto.data } });

  after(async () => {
    // Avisa o dono do check-in e quem já comentou nele (a conversa).
    const anteriores = await prisma.comentario.findMany({
      where: { checkinId },
      select: { usuarioId: true },
      distinct: ["usuarioId"],
    });
    const destinatarios = new Set([checkin.usuarioId, ...anteriores.map((c) => c.usuarioId)]);
    destinatarios.delete(usuario.id);
    await notificar([...destinatarios], {
      titulo: `${usuario.nome} comentou 💬`,
      corpo: texto.data.slice(0, 120),
      url: `/checkin/${checkinId}`,
      tag: `comentario-${checkinId}`,
    });
  });

  revalidatePath(`/checkin/${checkinId}`);
  return { ok: true };
}

export async function apagarComentario(comentarioId: string) {
  const usuario = await exigirUsuario();
  const comentario = await prisma.comentario.findUnique({ where: { id: comentarioId } });
  if (!comentario || comentario.usuarioId !== usuario.id) return;
  await prisma.comentario.delete({ where: { id: comentarioId } });
  revalidatePath(`/checkin/${comentario.checkinId}`);
}
