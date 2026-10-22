import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { urlDoDriver } from "@/lib/urlDoBanco";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** A DATABASE_URL com que o cliente em cache foi criado. */
  prismaUrl?: string;
};

function createPrismaClient(url: string) {
  // useTextProtocol: o protocolo binário padrão do driver `mariadb` envia
  // parâmetros de string sem informação de charset, fazendo o MySQL tratá-los
  // como collation `binary` — qualquer filtro `contains`/`startsWith`/`endsWith`
  // (LIKE) contra uma coluna utf8mb4_unicode_ci quebra com "Illegal mix of
  // collations". O protocolo de texto escapa os valores como SQL inline, com
  // o charset da conexão, evitando o problema.
  const adapter = new PrismaMariaDb(urlDoDriver(url), { useTextProtocol: true });
  return new PrismaClient({ adapter });
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não configurada. Veja o .env.example.");

// Em dev o Next reavalia os módulos a cada edição; sem o cache em globalThis o
// processo abriria um pool novo por recompilação até estourar as conexões do
// MySQL. O cache é por URL: quando o .env muda com o `next dev` rodando, o Next
// recarrega as variáveis e reavalia este módulo, e um cliente criado com a URL
// antiga (senha errada, banco que ainda não existia) seria reaproveitado para
// sempre — cada consulta morreria em "pool timeout".
const reaproveitavel = globalForPrisma.prismaUrl === url ? globalForPrisma.prisma : undefined;
if (!reaproveitavel && globalForPrisma.prisma) {
  void globalForPrisma.prisma.$disconnect().catch(() => {});
}

export const prisma = reaproveitavel ?? createPrismaClient(url);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUrl = url;
}
