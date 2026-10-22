"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";
import { codigoConviteLivre, exigirFamilia, normalizarCodigo } from "@/lib/familia";
import type { EstadoDoForm } from "@/acoes/estado";

export async function criarFamilia(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const nome = z.string().trim().min(2).max(80).safeParse(form.get("nome"));
  if (!nome.success) return { erro: "Dê um nome para a família (2 a 80 caracteres)." };

  const familia = await prisma.familia.create({
    data: {
      nome: nome.data,
      codigoConvite: await codigoConviteLivre(),
      membros: { create: { usuarioId: usuario.id, papel: "ADMIN" } },
    },
  });
  await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaAtivaId: familia.id } });
  redirect("/familia");
}

export async function entrarNaFamilia(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const usuario = await exigirUsuario();
  const codigo = normalizarCodigo(String(form.get("codigo") ?? ""));
  if (!codigo) return { erro: "Informe o código de convite." };

  const familia = await prisma.familia.findUnique({ where: { codigoConvite: codigo }, select: { id: true } });
  if (!familia) return { erro: "Código de convite não encontrado." };

  await prisma.membro.upsert({
    where: { usuarioId_familiaId: { usuarioId: usuario.id, familiaId: familia.id } },
    create: { usuarioId: usuario.id, familiaId: familia.id },
    update: {},
  });
  await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaAtivaId: familia.id } });
  redirect("/");
}

export async function trocarFamiliaAtiva(familiaId: string) {
  const usuario = await exigirUsuario();
  const membro = await prisma.membro.findUnique({
    where: { usuarioId_familiaId: { usuarioId: usuario.id, familiaId } },
  });
  if (!membro) return;
  await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaAtivaId: familiaId } });
  redirect("/");
}

async function exigirAdmin() {
  const ctx = await exigirFamilia();
  if (ctx.papel !== "ADMIN") throw new Error("Só administradores da família podem fazer isso.");
  return ctx;
}

export async function atualizarFamilia(_: EstadoDoForm, form: FormData): Promise<EstadoDoForm> {
  const { familia } = await exigirAdmin();
  const nome = z.string().trim().min(2).max(80).safeParse(form.get("nome"));
  if (!nome.success) return { erro: "Nome inválido (2 a 80 caracteres)." };

  await prisma.familia.update({
    where: { id: familia.id },
    data: { nome: nome.data, borrarAtePostar: form.get("borrarAtePostar") === "on" },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function gerarNovoConvite() {
  const { familia } = await exigirAdmin();
  await prisma.familia.update({ where: { id: familia.id }, data: { codigoConvite: await codigoConviteLivre() } });
  revalidatePath("/familia");
}

export async function removerMembro(usuarioId: string) {
  const { familia, usuario } = await exigirAdmin();
  if (usuarioId === usuario.id) return;
  await prisma.membro.delete({ where: { usuarioId_familiaId: { usuarioId, familiaId: familia.id } } });
  revalidatePath("/familia");
}

export async function sairDaFamilia() {
  const { familia, usuario } = await exigirFamilia();

  // Último admin não pode sair deixando a família sem dono.
  const admins = await prisma.membro.count({ where: { familiaId: familia.id, papel: "ADMIN" } });
  const membros = await prisma.membro.count({ where: { familiaId: familia.id } });
  const souAdmin = await prisma.membro.count({
    where: { familiaId: familia.id, usuarioId: usuario.id, papel: "ADMIN" },
  });
  if (souAdmin && admins === 1 && membros > 1) {
    throw new Error("Promova outro membro a administrador antes de sair.");
  }

  await prisma.membro.delete({ where: { usuarioId_familiaId: { usuarioId: usuario.id, familiaId: familia.id } } });
  if (membros === 1) await prisma.familia.delete({ where: { id: familia.id } });
  await prisma.usuario.update({ where: { id: usuario.id }, data: { familiaAtivaId: null } });
  redirect("/");
}

export async function tornarAdmin(usuarioId: string) {
  const { familia } = await exigirAdmin();
  await prisma.membro.update({
    where: { usuarioId_familiaId: { usuarioId, familiaId: familia.id } },
    data: { papel: "ADMIN" },
  });
  revalidatePath("/familia");
}
