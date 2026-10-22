import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { exigirUsuario, type UsuarioLogado } from "@/lib/auth";
import type { PapelNaFamilia } from "@/generated/prisma/client";

export interface Contexto {
  usuario: UsuarioLogado;
  familia: { id: string; nome: string; codigoConvite: string; borrarAtePostar: boolean };
  papel: PapelNaFamilia;
}

/**
 * Usuário logado + família ativa, validando que ele ainda é membro dela. Sem
 * família (recém-cadastrado ou removido), manda para /comecar.
 */
export const exigirFamilia = cache(async (): Promise<Contexto> => {
  const usuario = await exigirUsuario();

  // A família ativa pode ter deixado de existir ou a pessoa pode ter saído;
  // nesse caso cai na primeira família de que ainda é membro.
  const membros = await prisma.membro.findMany({
    where: { usuarioId: usuario.id },
    include: { familia: { select: { id: true, nome: true, codigoConvite: true, borrarAtePostar: true } } },
    orderBy: { entrouEm: "asc" },
  });
  if (membros.length === 0) redirect("/comecar");

  const membro = membros.find((m) => m.familiaId === usuario.familiaAtivaId) ?? membros[0];
  if (membro.familiaId !== usuario.familiaAtivaId) {
    await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaAtivaId: membro.familiaId } });
  }

  return { usuario, familia: membro.familia, papel: membro.papel };
});

/** Garante que o usuário é membro da família — use antes de expor dados dela. */
export async function ehMembro(usuarioId: string, familiaId: string) {
  const membro = await prisma.membro.findUnique({
    where: { usuarioId_familiaId: { usuarioId, familiaId } },
    select: { papel: true },
  });
  return membro !== null;
}

// Sem 0/O/1/I/L: o código também é ditado por telefone.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function gerarCodigoConvite(tamanho = 6) {
  let codigo = "";
  for (let i = 0; i < tamanho; i++) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
}

export async function codigoConviteLivre() {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerarCodigoConvite();
    const existe = await prisma.familia.findUnique({ where: { codigoConvite: codigo }, select: { id: true } });
    if (!existe) return codigo;
  }
  throw new Error("Não foi possível gerar um código de convite único.");
}

export function normalizarCodigo(codigo: string) {
  return codigo.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
