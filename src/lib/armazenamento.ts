import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";

/**
 * Onde as fotos moram.
 *
 * - Produção (Vercel): um bucket compatível com S3 — Cloudflare R2 no plano
 *   grátis. Na Vercel não existe disco permanente; o que for gravado some.
 * - Desenvolvimento: a pasta STORAGE_DIR (padrão ./uploads).
 *
 * O motor é escolhido pelas variáveis: com S3_BUCKET definido, usa o bucket.
 * `aws4fetch` assina as requisições S3 com ~7 KB de código — o SDK da AWS
 * pesaria megabytes no início frio de cada função.
 */

export interface Armazenamento {
  gravar(chave: string, conteudo: Buffer, tipo: string): Promise<void>;
  ler(chave: string): Promise<Buffer>;
  apagar(chave: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// S3 / R2
// ---------------------------------------------------------------------------

function criarS3(): Armazenamento {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET;
  if (!endpoint || !bucket || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Armazenamento S3 incompleto: defina S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY.");
  }
  const cliente = new AwsClient({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    service: "s3",
    region: process.env.S3_REGION || "auto",
  });
  // Endereço "path-style" (endpoint/bucket/chave): funciona no R2, B2 e MinIO.
  const url = (chave: string) => `${endpoint}/${bucket}/${chave.split("/").map(encodeURIComponent).join("/")}`;

  return {
    async gravar(chave, conteudo, tipo) {
      const resposta = await cliente.fetch(url(chave), {
        method: "PUT",
        body: new Uint8Array(conteudo),
        headers: { "Content-Type": tipo },
      });
      if (!resposta.ok) throw new Error(`Falha ao gravar foto (${resposta.status}).`);
    },
    async ler(chave) {
      const resposta = await cliente.fetch(url(chave));
      if (!resposta.ok) throw new Error(`Foto não encontrada (${resposta.status}).`);
      return Buffer.from(await resposta.arrayBuffer());
    },
    async apagar(chave) {
      const resposta = await cliente.fetch(url(chave), { method: "DELETE" });
      // 404 ao apagar não é erro: o objeto já não existe.
      if (!resposta.ok && resposta.status !== 404) throw new Error(`Falha ao apagar foto (${resposta.status}).`);
    },
  };
}

// ---------------------------------------------------------------------------
// Disco (só desenvolvimento)
// ---------------------------------------------------------------------------

function criarDisco(): Armazenamento {
  if (process.env.VERCEL) {
    throw new Error("Na Vercel as fotos precisam de um bucket S3/R2 — defina S3_BUCKET e as chaves. Veja o .env.example.");
  }
  const raiz = path.resolve(process.env.STORAGE_DIR || "./uploads");
  /** Garante que a chave não escapa da pasta (ex.: "../../etc"). */
  const absoluto = (chave: string) => {
    const destino = path.resolve(raiz, chave);
    if (destino !== raiz && !destino.startsWith(raiz + path.sep)) throw new Error("Caminho de foto inválido.");
    return destino;
  };

  return {
    async gravar(chave, conteudo) {
      const destino = absoluto(chave);
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, conteudo);
    },
    ler: (chave) => readFile(absoluto(chave)),
    async apagar(chave) {
      await unlink(absoluto(chave)).catch(() => {});
    },
  };
}

let instancia: Armazenamento | undefined;

export function armazenamento(): Armazenamento {
  instancia ??= process.env.S3_BUCKET ? criarS3() : criarDisco();
  return instancia;
}
