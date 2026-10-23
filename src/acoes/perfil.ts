"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";
import { enviarCodigo } from "@/lib/codigos";
import { apagarFotos, caminhoDoAvatar, salvarAvatar } from "@/lib/fotos";
import { normalizarTelefone } from "@/lib/telefone";
import type { EstadoDoForm } from "@/acoes/estado";

export async function trocarFoto(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const foto = form.get("foto");
  if (!(foto instanceof File) || foto.size === 0) return { erro: "Escolha uma foto." };

  const versao = usuario.avatarVersao + 1;
  try {
    await salvarAvatar(foto, usuario.id, versao);
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não foi possível salvar a foto." };
  }
  await prisma.usuario.update({ where: { id: usuario.id }, data: { avatarVersao: versao } });
  if (usuario.avatarVersao > 0) await apagarFotos(caminhoDoAvatar(usuario.id, usuario.avatarVersao));

  // O avatar aparece no feed, painel, placar e comentários.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removerFoto(): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  if (usuario.avatarVersao === 0) return { ok: true };
  await prisma.usuario.update({ where: { id: usuario.id }, data: { avatarVersao: 0 } });
  await apagarFotos(caminhoDoAvatar(usuario.id, usuario.avatarVersao));
  revalidatePath("/", "layout");
  return { ok: true };
}

const esquemaPerfil = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.email("E-mail inválido.").trim().toLowerCase(),
  telefone: z.string().trim(),
});

export async function atualizarPerfil(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const dados = esquemaPerfil.safeParse({
    nome: form.get("nome"),
    email: form.get("email"),
    telefone: form.get("telefone") ?? "",
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { nome, email } = dados.data;

  // Celular vazio = remover; preenchido precisa ser válido.
  let telefone: string | null = null;
  if (dados.data.telefone) {
    telefone = normalizarTelefone(dados.data.telefone);
    if (!telefone) return { erro: "Celular inválido. Use DDD + número, ex.: (11) 98765-4321." };
  }

  const conflito = await prisma.usuario.findFirst({
    where: { id: { not: usuario.id }, OR: [{ email }, ...(telefone ? [{ telefone }] : [])] },
    select: { email: true },
  });
  if (conflito) {
    return { erro: conflito.email === email ? "Esse e-mail já está em outra conta." : "Esse celular já está em outra conta." };
  }

  const trocouEmail = email !== usuario.email;
  await prisma.usuario.update({
    where: { id: usuario.id },
    // E-mail novo começa sem confirmação: a recuperação de senha passa a ir para ele.
    data: { nome, email, telefone, ...(trocouEmail ? { emailVerificadoEm: null } : {}) },
  });
  revalidatePath("/", "layout");

  if (trocouEmail) {
    await enviarCodigo({ id: usuario.id, nome, email }, "CONFIRMAR_EMAIL");
    redirect("/confirmar-email?depois=/perfil");
  }
  return { ok: true };
}
