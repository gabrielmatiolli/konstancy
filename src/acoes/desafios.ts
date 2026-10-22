"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { hoje, paraDate, rotuloCurto } from "@/lib/datas";
import { membrosExceto, notificar } from "@/lib/push";
import type { EstadoDoForm } from "@/acoes/estado";

const DIA = /^\d{4}-\d{2}-\d{2}$/;

const esquema = z
  .object({
    titulo: z.string().trim().min(3, "Dê um título ao desafio.").max(100),
    descricao: z.string().trim().max(1000).optional(),
    premio: z.string().trim().min(2, "Qual é o prêmio?").max(200),
    dataInicio: z.string().regex(DIA, "Data de início inválida."),
    dataFim: z.string().regex(DIA, "Data de fim inválida."),
    todos: z.literal("on").optional(),
  })
  .refine((d) => d.dataFim >= d.dataInicio, { message: "A data de fim precisa ser depois do início." })
  .refine((d) => d.dataFim >= hoje(), { message: "A data de fim já passou." });

export async function criarDesafio(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const { usuario, familia } = await exigirFamilia();
  const dados = esquema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const d = dados.data;

  // "Todos participam" inscreve a família inteira; senão só o criador, e os
  // outros entram pelo botão Participar.
  const participantes = d.todos
    ? (await prisma.membro.findMany({ where: { familiaId: familia.id }, select: { usuarioId: true } })).map(
        (m) => m.usuarioId,
      )
    : [usuario.id];

  const desafio = await prisma.desafio.create({
    data: {
      familiaId: familia.id,
      criadorId: usuario.id,
      titulo: d.titulo,
      descricao: d.descricao || null,
      premio: d.premio,
      dataInicio: paraDate(d.dataInicio),
      dataFim: paraDate(d.dataFim),
      participantes: { create: participantes.map((usuarioId) => ({ usuarioId })) },
    },
  });

  after(async () =>
    notificar(await membrosExceto(familia.id, usuario.id), {
      titulo: `Novo desafio: ${d.titulo} 🏆`,
      corpo: `Até ${rotuloCurto(d.dataFim)} · Prêmio: ${d.premio}`,
      url: `/desafios/${desafio.id}`,
    }),
  );

  revalidatePath("/desafios");
  redirect(`/desafios/${desafio.id}`);
}

async function desafioDaFamilia(desafioId: string) {
  const ctx = await exigirFamilia();
  const desafio = await prisma.desafio.findFirst({ where: { id: desafioId, familiaId: ctx.familia.id } });
  if (!desafio) throw new Error("Desafio não encontrado.");
  return { ...ctx, desafio };
}

export async function participar(desafioId: string) {
  const { usuario } = await desafioDaFamilia(desafioId);
  await prisma.participante.upsert({
    where: { desafioId_usuarioId: { desafioId, usuarioId: usuario.id } },
    create: { desafioId, usuarioId: usuario.id },
    update: {},
  });
  revalidatePath(`/desafios/${desafioId}`);
}

export async function deixarDeParticipar(desafioId: string) {
  const { usuario } = await desafioDaFamilia(desafioId);
  await prisma.participante.deleteMany({ where: { desafioId, usuarioId: usuario.id } });
  revalidatePath(`/desafios/${desafioId}`);
}

export async function apagarDesafio(desafioId: string) {
  const { usuario, papel, desafio } = await desafioDaFamilia(desafioId);
  if (desafio.criadorId !== usuario.id && papel !== "ADMIN") return;
  await prisma.desafio.delete({ where: { id: desafioId } });
  revalidatePath("/desafios");
  redirect("/desafios");
}
