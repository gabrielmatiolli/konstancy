"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encerrarSessao, hashDaSenha, iniciarSessao, senhaConfere } from "@/lib/auth";
import { enviarCodigo } from "@/lib/codigos";
import { normalizarCodigo } from "@/lib/familia";
import { normalizarTelefone } from "@/lib/telefone";
import { buscarPorIdentificador } from "@/lib/contas";
import type { EstadoDoForm } from "@/acoes/estado";

const esquemaCadastro = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.email("E-mail inválido.").trim().toLowerCase(),
  telefone: z.string().trim().optional(),
  senha: z.string().min(6, "A senha precisa de pelo menos 6 caracteres.").max(100),
  codigo: z.string().optional(),
});

export async function cadastrar(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const dados = esquemaCadastro.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { nome, email, senha } = dados.data;

  // Celular é opcional; se veio, precisa ser válido e não pode estar em outra conta.
  let telefone: string | null = null;
  if (dados.data.telefone) {
    telefone = normalizarTelefone(dados.data.telefone);
    if (!telefone) return { erro: "Celular inválido. Use DDD + número, ex.: (11) 98765-4321." };
  }

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ email }, ...(telefone ? [{ telefone }] : [])] },
    select: { email: true },
  });
  if (existente) {
    return { erro: existente.email === email ? "Já existe uma conta com esse e-mail." : "Esse celular já está em outra conta." };
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
      telefone,
      senhaHash: await hashDaSenha(senha),
      familiaAtivaId: familia?.id,
      membros: familia ? { create: { familiaId: familia.id } } : undefined,
    },
  });

  await iniciarSessao(usuario.id, usuario.versaoSessao);
  // Falha no envio não impede o cadastro: a tela de confirmação tem "reenviar".
  await enviarCodigo(usuario, "CONFIRMAR_EMAIL");
  redirect(`/confirmar-email?depois=${familia ? "/" : "/comecar"}`);
}

const esquemaLogin = z.object({
  identificador: z.string().trim(),
  senha: z.string(),
  de: z.string().optional(),
});

export async function entrar(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const dados = esquemaLogin.safeParse(Object.fromEntries(form));
  if (!dados.success || !dados.data.identificador) return { erro: "Preencha e-mail ou celular e a senha." };

  const usuario = await buscarPorIdentificador(dados.data.identificador);
  if (!usuario || !(await senhaConfere(dados.data.senha, usuario.senhaHash))) {
    return { erro: "Login ou senha incorretos." };
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
