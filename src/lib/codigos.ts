import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { emailDeCodigo, enviarEmail } from "@/lib/email";
import type { FinalidadeDoCodigo } from "@/generated/prisma/client";

const VALIDADE_MIN = 15;
const MAX_TENTATIVAS = 5;
/** Intervalo mínimo entre dois envios para a mesma pessoa e finalidade. */
export const ESPERA_REENVIO_S = 60;
const MAX_ENVIOS_POR_HORA = 5;

const MOTIVOS: Record<FinalidadeDoCodigo, { assunto: string; motivo: string }> = {
  CONFIRMAR_EMAIL: {
    assunto: "Confirme seu e-mail",
    motivo: "Use este código para confirmar seu e-mail no app.",
  },
  RECUPERAR_SENHA: {
    assunto: "Recuperar sua senha",
    motivo: "Use este código para criar uma senha nova.",
  },
};

function hmac(codigo: string) {
  return createHmac("sha256", process.env.SESSAO_SEGREDO!).update(codigo).digest("hex");
}

export type ResultadoDoEnvio = { ok: true } | { ok: false; erro: string };

/**
 * Gera e envia um código novo, invalidando os anteriores da mesma finalidade.
 * Limita reenvios (1 por minuto, 5 por hora) para não virar spam nem estourar
 * a cota do SMTP.
 */
export async function enviarCodigo(
  usuario: { id: string; nome: string; email: string },
  finalidade: FinalidadeDoCodigo,
): Promise<ResultadoDoEnvio> {
  const umaHoraAtras = new Date(Date.now() - 3_600_000);
  const recentes = await prisma.codigoVerificacao.findMany({
    where: { usuarioId: usuario.id, finalidade, criadoEm: { gte: umaHoraAtras } },
    orderBy: { criadoEm: "desc" },
    select: { criadoEm: true },
  });
  const segundosDesdeUltimo = recentes[0] ? (Date.now() - recentes[0].criadoEm.getTime()) / 1000 : Infinity;
  if (segundosDesdeUltimo < ESPERA_REENVIO_S) {
    return { ok: false, erro: `Aguarde ${Math.ceil(ESPERA_REENVIO_S - segundosDesdeUltimo)} s para pedir outro código.` };
  }
  if (recentes.length >= MAX_ENVIOS_POR_HORA) {
    return { ok: false, erro: "Muitos códigos pedidos. Tente de novo daqui a uma hora." };
  }

  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.$transaction([
    prisma.codigoVerificacao.updateMany({
      where: { usuarioId: usuario.id, finalidade, usadoEm: null },
      data: { usadoEm: new Date() },
    }),
    prisma.codigoVerificacao.create({
      data: {
        usuarioId: usuario.id,
        finalidade,
        codigoHash: hmac(codigo),
        destino: usuario.email,
        expiraEm: new Date(Date.now() + VALIDADE_MIN * 60_000),
      },
    }),
  ]);

  const { assunto, motivo } = MOTIVOS[finalidade];
  try {
    await enviarEmail({ para: usuario.email, assunto: `${codigo} é seu código · ${assunto}`, ...emailDeCodigo({ nome: usuario.nome, codigo, motivo }) });
  } catch (erro) {
    console.error("[codigos] falha ao enviar e-mail", erro);
    return { ok: false, erro: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." };
  }
  return { ok: true };
}

/**
 * Confere o código do último envio válido. Erro conta tentativa; na quinta, o
 * código morre e é preciso pedir outro. Acerto marca como usado (uso único).
 */
export async function conferirCodigo(
  usuarioId: string,
  finalidade: FinalidadeDoCodigo,
  digitado: string,
  destino: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const codigo = digitado.replace(/\D/g, "");
  if (codigo.length !== 6) return { ok: false, erro: "O código tem 6 números." };

  const atual = await prisma.codigoVerificacao.findFirst({
    where: { usuarioId, finalidade, usadoEm: null, destino },
    orderBy: { criadoEm: "desc" },
  });
  if (!atual || atual.expiraEm < new Date() || atual.tentativas >= MAX_TENTATIVAS) {
    return { ok: false, erro: "Código expirado. Peça um novo." };
  }

  const certo = timingSafeEqual(Buffer.from(atual.codigoHash, "hex"), Buffer.from(hmac(codigo), "hex"));
  if (!certo) {
    const tentativas = atual.tentativas + 1;
    await prisma.codigoVerificacao.update({ where: { id: atual.id }, data: { tentativas } });
    const restam = MAX_TENTATIVAS - tentativas;
    return {
      ok: false,
      erro: restam > 0 ? `Código incorreto. Restam ${restam} tentativa${restam === 1 ? "" : "s"}.` : "Código incorreto. Peça um novo.",
    };
  }

  await prisma.codigoVerificacao.update({ where: { id: atual.id }, data: { usadoEm: new Date() } });
  return { ok: true };
}

/** "g•••••l@gmail.com" — mostra para onde foi sem expor o endereço inteiro. */
export function mascararEmail(email: string) {
  const [nome, dominio] = email.split("@");
  if (nome.length <= 2) return `${nome[0]}•••@${dominio}`;
  return `${nome[0]}${"•".repeat(Math.min(5, nome.length - 2))}${nome.at(-1)}@${dominio}`;
}

/** Último código ainda válido para este destino e quantos segundos faltam para poder reenviar. */
export async function codigoPendente(usuarioId: string, finalidade: FinalidadeDoCodigo, destino: string) {
  const atual = await prisma.codigoVerificacao.findFirst({
    where: { usuarioId, finalidade, destino, usadoEm: null, expiraEm: { gt: new Date() }, tentativas: { lt: MAX_TENTATIVAS } },
    orderBy: { criadoEm: "desc" },
    select: { criadoEm: true },
  });
  if (!atual) return null;
  const passados = (Date.now() - atual.criadoEm.getTime()) / 1000;
  return { esperaReenvio: Math.max(0, Math.ceil(ESPERA_REENVIO_S - passados)) };
}
