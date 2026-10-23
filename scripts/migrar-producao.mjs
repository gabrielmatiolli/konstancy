// Roda no build da Vercel (script "vercel-build"): aplica as migrations no
// banco de produção antes do `next build`. Em deploys de prévia (branches),
// não mexe no banco — senão um teste aplicaria migration em produção.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`[migrar] ambiente "${process.env.VERCEL_ENV ?? "local"}": migrations não aplicadas.`);
  process.exit(0);
}

const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
