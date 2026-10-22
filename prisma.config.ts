import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Mesma precedência do Next.js: `.env.local` (dev, nunca vai no ZIP) vence o
// `.env` (produção, vai no ZIP da Hostinger). O dotenv não sobrescreve variável
// já definida, então carregar o `.env.local` primeiro basta. Sem isso, o Prisma
// lê só o `.env` — e um `migrate dev` na máquina de dev rodaria contra o banco
// de produção.
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
const host = hostDoBanco(process.env.DATABASE_URL);

// `migrate dev` cria um banco de sombra e, se achar divergência, oferece
// resetar o banco; `migrate reset` e `db push` também podem apagar dados. Num
// banco de produção, um "y" apressado apaga tudo. Migration nasce no banco
// local e sobe para a Hostinger com `npm run db:deploy`.
if (
  /\b(migrate\s+(dev|reset)|db\s+push)\b/.test(comando) &&
  !pedindoAjuda &&
  !LOOPBACK.has(host) &&
  process.env.PERMITIR_MIGRATE_REMOTO !== "1"
) {
  throw new Error(
    `"prisma ${comando}" bloqueado: a DATABASE_URL aponta para ${host || "um host desconhecido"}, ` +
      "fora desta máquina. Para aplicar as migrations num banco remoto, use " +
      "`npm run db:deploy`. Para desenvolver, aponte o `.env.local` para o MySQL " +
      "local. Se for mesmo intencional, defina PERMITIR_MIGRATE_REMOTO=1.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
