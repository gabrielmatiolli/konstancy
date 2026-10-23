/**
 * Dados de desenvolvimento: uma família de teste com três contas.
 * Senha de todas as contas: teste123 — só para o banco local. Entram por
 * e-mail ou pelo celular de teste abaixo (números fictícios).
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { urlDoDriver } from "../src/lib/urlDoBanco";

const url = process.env.DATABASE_URL!;
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  throw new Error("O seed só roda contra o MySQL local.");
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(urlDoDriver(url), { useTextProtocol: true }) });

const CONTAS = [
  { nome: "Ana Teste", email: "ana@teste.local", telefone: "+5511900000001" },
  { nome: "Bruno Teste", email: "bruno@teste.local", telefone: "+5511900000002" },
  { nome: "Carla Teste", email: "carla@teste.local", telefone: "+5511900000003" },
];

async function main() {
  const senhaHash = await bcrypt.hash("teste123", 12);

  const familia = await prisma.familia.upsert({
    where: { codigoConvite: "TESTE1" },
    create: { nome: "Família Teste", codigoConvite: "TESTE1" },
    update: {},
  });

  for (const [i, conta] of CONTAS.entries()) {
    const usuario = await prisma.usuario.upsert({
      where: { email: conta.email },
      create: { ...conta, senhaHash, familiaAtivaId: familia.id },
      update: { telefone: conta.telefone },
    });
    await prisma.membro.upsert({
      where: { usuarioId_familiaId: { usuarioId: usuario.id, familiaId: familia.id } },
      create: { usuarioId: usuario.id, familiaId: familia.id, papel: i === 0 ? "ADMIN" : "MEMBRO" },
      update: {},
    });
  }

  console.log(`Seed ok: ${CONTAS.map((c) => c.email).join(", ")} (senha teste123), convite TESTE1.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
