import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const COOKIE_DE_SESSAO = "konstancy_sessao";
/** Família usa o app no celular todo dia — sessão longa, renovada a cada login. */
const VALIDADE_DIAS = 90;

interface DadosDaSessao {
  sub: string;
  ver: number;
}

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  emailVerificado: boolean;
  avatarVersao: number;
  familiaAtivaId: string | null;
}

function chave() {
  const segredo = process.env.SESSAO_SEGREDO;
  if (!segredo || segredo.length < 32) {
    throw new Error("SESSAO_SEGREDO ausente ou curto demais (mínimo 32 caracteres). Veja o .env.example.");
  }
  return new TextEncoder().encode(segredo);
}

export async function hashDaSenha(senha: string) {
  return bcrypt.hash(senha, 12);
}

export async function senhaConfere(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

export async function iniciarSessao(usuarioId: string, versaoSessao: number) {
  const token = await new SignJWT({ ver: versaoSessao })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${VALIDADE_DIAS}d`)
    .sign(chave());

  (await cookies()).set(COOKIE_DE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VALIDADE_DIAS * 86_400,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE_DE_SESSAO);
}

/** Só confere a assinatura do cookie — não toca no banco. */
const lerSessao = cache(async (): Promise<DadosDaSessao | null> => {
  const token = (await cookies()).get(COOKIE_DE_SESSAO)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    if (typeof payload.sub !== "string" || typeof payload.ver !== "number") return null;
    return { sub: payload.sub, ver: payload.ver };
  } catch {
    return null;
  }
});

/**
 * Sessão validada contra o banco (conta existe e o token não foi invalidado
 * por versaoSessao). Memoizado por request.
 */
export const usuarioLogado = cache(async (): Promise<UsuarioLogado | null> => {
  const dados = await lerSessao();
  if (!dados) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: dados.sub },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      emailVerificadoEm: true,
      avatarVersao: true,
      familiaAtivaId: true,
      versaoSessao: true,
    },
  });
  if (!usuario || usuario.versaoSessao !== dados.ver) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    emailVerificado: usuario.emailVerificadoEm !== null,
    avatarVersao: usuario.avatarVersao,
    familiaAtivaId: usuario.familiaAtivaId,
  };
});

/** Use no início de toda página e Server Action autenticada. */
export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await usuarioLogado();
  if (!usuario) redirect("/entrar");
  return usuario;
}

// ---------------------------------------------------------------------------
// Recuperação de senha
// ---------------------------------------------------------------------------

/**
 * Quem está recuperando a senha ainda não tem sessão: um cookie curto e
 * assinado guarda de quem é o processo. `verificado` só vira true depois do
 * código certo — é o que libera a tela de senha nova.
 */
const COOKIE_DE_RECUPERACAO = "konstancy_recuperacao";
const VALIDADE_RECUPERACAO_MIN = 20;

export async function iniciarRecuperacao(usuarioId: string, verificado = false) {
  const token = await new SignJWT({ fin: "recuperar", ok: verificado })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${VALIDADE_RECUPERACAO_MIN}m`)
    .sign(chave());
  (await cookies()).set(COOKIE_DE_RECUPERACAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/recuperar",
    maxAge: VALIDADE_RECUPERACAO_MIN * 60,
  });
}

export async function lerRecuperacao(): Promise<{ usuarioId: string; verificado: boolean } | null> {
  const token = (await cookies()).get(COOKIE_DE_RECUPERACAO)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave());
    if (payload.fin !== "recuperar" || typeof payload.sub !== "string") return null;
    return { usuarioId: payload.sub, verificado: payload.ok === true };
  } catch {
    return null;
  }
}

export async function encerrarRecuperacao() {
  (await cookies()).delete({ name: COOKIE_DE_RECUPERACAO, path: "/recuperar" });
}
