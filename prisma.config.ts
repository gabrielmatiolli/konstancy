import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Mesma precedência do Next.js: `.env.local` (dev) vence o `.env`. O dotenv não
// sobrescreve variável já definida, então carregar o `.env.local` primeiro
// basta. Na Vercel as variáveis já vêm do painel e nenhum arquivo é lido.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

/**
 * Host da DATABASE_URL lido do texto, sem `new URL`: uma senha com `#` mal
 * codificado quebra o parser — e é justamente com a URL errada que esta
 * trava precisa continuar funcionando.
 */
function hostDoBanco(url: string | undefined) {
  if (!url) return "";
  const semEsquema = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const autoridade = semEsquema.slice(semEsquema.lastIndexOf("@") + 1);
  if (autoridade.startsWith("[")) return autoridade.slice(1, autoridade.indexOf("]"));
  return autoridade.split(/[/:?#]/)[0];
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);
const argumentos = process.argv.slice(2);
const comando = argumentos.join(" ");
const pedindoAjuda = argumentos.some((a) => a === "--help" || a === "-h");
/**
 * O CLI (migrations) precisa de conexão direta; o app usa a "pooled". A
 * integração do Neon na Vercel cria as duas: DATABASE_URL (pooled) e
 * DATABASE_URL_UNPOOLED (direta). Local, só a DATABASE_URL existe.
 */
const urlDoCli = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
const host = hostDoBanco(urlDoCli);

// `migrate dev` cria um banco de sombra e, se achar divergência, oferece
// resetar o banco; `migrate reset` e `db push` também podem apagar dados. Num
// banco de produção, um "y" apressado apaga tudo. Migration nasce no banco
// local (`prisma dev`) e sobe para o Neon no build de produção da Vercel.
if (
  /\b(migrate\s+(dev|reset)|db\s+push)\b/.test(comando) &&
  !pedindoAjuda &&
  !LOOPBACK.has(host) &&
  process.env.PERMITIR_MIGRATE_REMOTO !== "1"
) {
  throw new Error(
    `"prisma ${comando}" bloqueado: a DATABASE_URL aponta para ${host || "um host desconhecido"}, ` +
      "fora desta máquina. Para aplicar as migrations num banco remoto, use " +
      "`npm run db:deploy`. Para desenvolver, aponte o `.env.local` para o Postgres " +
      "local (`npm run db:local`). Se for mesmo intencional, defina PERMITIR_MIGRATE_REMOTO=1.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: urlDoCli,
  },
});
