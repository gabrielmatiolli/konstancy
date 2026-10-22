import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const COOKIE_DE_SESSAO = "saudecheck_sessao";
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
    select: { id: true, nome: true, email: true, familiaAtivaId: true, versaoSessao: true },
  });
  if (!usuario || usuario.versaoSessao !== dados.ver) return null;

  return { id: usuario.id, nome: usuario.nome, email: usuario.email, familiaAtivaId: usuario.familiaAtivaId };
});

/** Use no início de toda página e Server Action autenticada. */
export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await usuarioLogado();
  if (!usuario) redirect("/entrar");
  return usuario;
}
