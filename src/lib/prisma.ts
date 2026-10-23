import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** A DATABASE_URL com que o cliente em cache foi criado. */
  prismaUrl?: string;
};

function createPrismaClient(url: string) {
  // Na Vercel cada função é uma instância própria e o Neon limita conexões:
  // pool pequeno por instância, com a URL "pooled" do Neon (PgBouncer) na frente.
  const adapter = new PrismaPg({ connectionString: url, max: 5 });
  return new PrismaClient({ adapter });
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não configurada. Veja o .env.example.");

// Em dev o Next reavalia os módulos a cada edição; sem o cache em globalThis o
// processo abriria um pool novo por recompilação até estourar as conexões. O
// cache é por URL: se o .env muda com o `next dev` rodando, o cliente antigo
// (apontando para outro banco) não é reaproveitado.
const reaproveitavel = globalForPrisma.prismaUrl === url ? globalForPrisma.prisma : undefined;
if (!reaproveitavel && globalForPrisma.prisma) {
  void globalForPrisma.prisma.$disconnect().catch(() => {});
}

export const prisma = reaproveitavel ?? createPrismaClient(url);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUrl = url;
}
