"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encerrarSessao, hashDaSenha, iniciarSessao, senhaConfere } from "@/lib/auth";
import { normalizarCodigo } from "@/lib/familia";
import type { EstadoDoForm } from "@/acoes/estado";

const esquemaCadastro = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.email("E-mail inválido.").trim().toLowerCase(),
  senha: z.string().min(6, "A senha precisa de pelo menos 6 caracteres.").max(100),
  codigo: z.string().optional(),
});

export async function cadastrar(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const dados = esquemaCadastro.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { nome, email, senha } = dados.data;

  if (await prisma.usuario.findUnique({ where: { email }, select: { id: true } })) {
    return { erro: "Já existe uma conta com esse e-mail." };
  }

  // Convite opcional: quem chega pelo link já entra direto na família.
  const codigo = dados.data.codigo ? normalizarCodigo(dados.data.codigo) : "";
  const familia = codigo
    ? await prisma.familia.findUnique({ where: { codigoConvite: codigo }, select: { id: true } })
    : null;
  if (codigo && !familia) return { erro: "Código de convite não encontrado." };

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: await hashDaSenha(senha),
      familiaAtivaId: familia?.id,
      membros: familia ? { create: { familiaId: familia.id } } : undefined,
    },
  });

  await iniciarSessao(usuario.id, usuario.versaoSessao);
  redirect(familia ? "/" : "/comecar");
}

const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase(),
  senha: z.string(),
  de: z.string().optional(),
});

export async function entrar(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const dados = esquemaLogin.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: "Preencha e-mail e senha." };

  const usuario = await prisma.usuario.findUnique({
    where: { email: dados.data.email },
    select: { id: true, senhaHash: true, versaoSessao: true },
  });
  if (!usuario || !(await senhaConfere(dados.data.senha, usuario.senhaHash))) {
    return { erro: "E-mail ou senha incorretos." };
  }

  await iniciarSessao(usuario.id, usuario.versaoSessao);
  // Só caminhos internos — evita redirecionamento aberto via ?de=.
  const destino = dados.data.de?.startsWith("/") && !dados.data.de.startsWith("//") ? dados.data.de : "/";
  redirect(destino);
}

export async function sair() {
  await encerrarSessao();
  redirect("/entrar");
}
