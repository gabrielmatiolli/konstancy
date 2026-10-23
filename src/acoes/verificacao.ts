"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  encerrarRecuperacao,
  exigirUsuario,
  hashDaSenha,
  iniciarRecuperacao,
  iniciarSessao,
  lerRecuperacao,
} from "@/lib/auth";
import { conferirCodigo, enviarCodigo } from "@/lib/codigos";
import { buscarPorIdentificador } from "@/lib/contas";
import type { EstadoDoForm } from "@/acoes/estado";

/** Só caminhos internos no "depois" — evita redirecionamento aberto. */
function destinoSeguro(bruto: FormDataEntryValue | null) {
  const d = typeof bruto === "string" ? bruto : "";
  return d.startsWith("/") && !d.startsWith("//") ? d : "/";
}

// ---------------------------------------------------------------------------
// Confirmar e-mail (logado)
// ---------------------------------------------------------------------------

export async function confirmarEmail(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const resultado = await conferirCodigo(usuario.id, "CONFIRMAR_EMAIL", String(form.get("codigo") ?? ""), usuario.email);
  if (!resultado.ok) return { erro: resultado.erro };

  await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificadoEm: new Date() } });
  redirect(destinoSeguro(form.get("depois")));
}

export async function enviarConfirmacao(): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const resultado = await enviarCodigo(usuario, "CONFIRMAR_EMAIL");
  // A tela troca de "Enviar código" para o campo do código.
  if (resultado.ok) revalidatePath("/confirmar-email");
  return resultado.ok ? { ok: true } : { erro: resultado.erro };
}

// ---------------------------------------------------------------------------
// Recuperar senha (sem sessão)
// ---------------------------------------------------------------------------

export async function pedirRecuperacao(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const identificador = String(form.get("identificador") ?? "").trim();
  if (!identificador) return { erro: "Informe o e-mail ou o celular da conta." };

  const usuario = await buscarPorIdentificador(identificador);
  // App de família, só por convite: dizer que a conta não existe ajuda mais do
  // que atrapalha (quem digitou errado sabe na hora).
  if (!usuario) return { erro: "Não encontramos conta com esse e-mail ou celular." };

  const envio = await enviarCodigo(usuario, "RECUPERAR_SENHA");
  if (!envio.ok) return { erro: envio.erro };
  await iniciarRecuperacao(usuario.id);
  redirect("/recuperar/codigo");
}

export async function reenviarRecuperacao(): Promise<EstadoDoForm> {
  const processo = await lerRecuperacao();
  if (!processo) return { erro: "O tempo acabou. Comece de novo." };
  const usuario = await prisma.usuario.findUnique({
    where: { id: processo.usuarioId },
    select: { id: true, nome: true, email: true },
  });
  if (!usuario) return { erro: "Conta não encontrada." };
  const envio = await enviarCodigo(usuario, "RECUPERAR_SENHA");
  return envio.ok ? { ok: true } : { erro: envio.erro };
}

export async function conferirCodigoDeRecuperacao(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const processo = await lerRecuperacao();
  if (!processo) redirect("/recuperar");
  const usuario = await prisma.usuario.findUnique({ where: { id: processo.usuarioId }, select: { email: true } });
  if (!usuario) redirect("/recuperar");

  const resultado = await conferirCodigo(processo.usuarioId, "RECUPERAR_SENHA", String(form.get("codigo") ?? ""), usuario.email);
  if (!resultado.ok) return { erro: resultado.erro };

  await iniciarRecuperacao(processo.usuarioId, true);
  redirect("/recuperar/nova-senha");
}

const esquemaSenha = z.string().min(6, "A senha precisa de pelo menos 6 caracteres.").max(100);

export async function redefinirSenha(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const processo = await lerRecuperacao();
  if (!processo?.verificado) redirect("/recuperar");

  const senha = esquemaSenha.safeParse(form.get("senha"));
  if (!senha.success) return { erro: senha.error.issues[0].message };

  // Senha nova derruba as sessões antigas (versaoSessao) — se alguém tinha a
  // senha velha, perde o acesso. Quem recebeu o código provou ser dono do e-mail.
  const usuario = await prisma.usuario.update({
    where: { id: processo.usuarioId },
    data: {
      senhaHash: await hashDaSenha(senha.data),
      versaoSessao: { increment: 1 },
      emailVerificadoEm: new Date(),
    },
    select: { id: true, versaoSessao: true },
  });

  await encerrarRecuperacao();
  await iniciarSessao(usuario.id, usuario.versaoSessao);
  redirect("/");
}
