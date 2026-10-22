import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

/**
 * Armazenamento das fotos em disco. Em produção o STORAGE_DIR fica fora da
 * pasta do app: a Hostinger recria a pasta a cada deploy de ZIP, e arquivos
 * enviados em runtime para /public nem são servidos pelo `next start`.
 *
 * Para trocar por S3/R2 no futuro, basta reimplementar salvarFoto/lerFoto.
 */

export const TAMANHO_MAXIMO = 15 * 1024 * 1024;
const LADO_FOTO = 1440;
const LADO_THUMB = 400;

function raiz() {
  return path.resolve(process.env.STORAGE_DIR || "./uploads");
}

/** Resolve um caminho relativo garantindo que não escapa do STORAGE_DIR. */
function caminhoAbsoluto(relativo: string) {
  const base = raiz();
  const absoluto = path.resolve(base, relativo);
  if (absoluto !== base && !absoluto.startsWith(base + path.sep)) {
    throw new Error("Caminho de foto inválido.");
  }
  return absoluto;
}

export interface FotoSalva {
  fotoPath: string;
  thumbPath: string;
  largura: number;
  altura: number;
}

/**
 * Normaliza a foto (gira conforme o EXIF, remove metadados — inclusive GPS —
 * e converte para WebP) e grava a versão grande e a miniatura.
 */
export async function salvarFoto(arquivo: File, id: string, dia: string): Promise<FotoSalva> {
  if (arquivo.size === 0) throw new Error("Foto vazia.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error("Foto grande demais (máx. 15 MB).");

  const entrada = Buffer.from(await arquivo.arrayBuffer());
  let base: Sharp;
  try {
    base = sharp(entrada, { failOn: "error" }).rotate();
    await base.metadata();
  } catch {
    throw new Error("Arquivo não é uma imagem válida.");
  }

  const [ano, mes] = dia.split("-");
  const pasta = path.posix.join("checkins", ano, mes);
  const fotoPath = path.posix.join(pasta, `${id}.webp`);
  const thumbPath = path.posix.join(pasta, `${id}_t.webp`);

  await mkdir(caminhoAbsoluto(pasta), { recursive: true });

  const { data: foto, info } = await base
    .clone()
    .resize(LADO_FOTO, LADO_FOTO, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize(LADO_THUMB, LADO_THUMB, { fit: "cover" })
    .webp({ quality: 70 })
    .toBuffer();

  await writeFile(caminhoAbsoluto(fotoPath), foto);
  await writeFile(caminhoAbsoluto(thumbPath), thumb);

  return { fotoPath, thumbPath, largura: info.width, altura: info.height };
}

export async function lerFoto(relativo: string) {
  return readFile(caminhoAbsoluto(relativo));
}

export async function apagarFotos(...relativos: string[]) {
  await Promise.all(relativos.map((r) => unlink(caminhoAbsoluto(r)).catch(() => {})));
}
