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
/*
 * Três tamanhos, pensando em Android de entrada no 4G:
 *   grande  1440px — só na tela do check-in, para dar zoom
 *   média    720px — o feed (360px de tela × densidade 2), ~5× mais leve que a grande
 *   miniatura 240px quadrada — células do painel e base da versão borrada
 */
const LADO_FOTO = 1440;
const LADO_MEDIA = 720;
const LADO_THUMB = 240;

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
  const mediaPath = caminhoDaMedia(fotoPath);

  await mkdir(caminhoAbsoluto(pasta), { recursive: true });

  const { data: foto, info } = await base
    .clone()
    .resize(LADO_FOTO, LADO_FOTO, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const media = await gerarMedia(foto);
  const thumb = await base
    .clone()
    .resize(LADO_THUMB, LADO_THUMB, { fit: "cover" })
    .webp({ quality: 65 })
    .toBuffer();

  await writeFile(caminhoAbsoluto(fotoPath), foto);
  await writeFile(caminhoAbsoluto(mediaPath), media);
  await writeFile(caminhoAbsoluto(thumbPath), thumb);

  return { fotoPath, thumbPath, largura: info.width, altura: info.height };
}

/** A versão média não tem coluna própria: mora ao lado da grande, com sufixo _m. */
export function caminhoDaMedia(fotoPath: string) {
  return fotoPath.replace(/\.webp$/, "_m.webp");
}

function gerarMedia(foto: Buffer) {
  return sharp(foto)
    .resize(LADO_MEDIA, LADO_MEDIA, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toBuffer();
}

export async function lerFoto(relativo: string) {
  return readFile(caminhoAbsoluto(relativo));
}

/**
 * Lê a versão média; check-ins anteriores a ela ganham a sua na primeira
 * leitura, gerada a partir da grande.
 */
export async function lerMedia(fotoPath: string) {
  const mediaPath = caminhoDaMedia(fotoPath);
  try {
    return await readFile(caminhoAbsoluto(mediaPath));
  } catch {
    const media = await gerarMedia(await lerFoto(fotoPath));
    await writeFile(caminhoAbsoluto(mediaPath), media).catch(() => {});
    return media;
  }
}

export async function apagarFotos(...relativos: string[]) {
  await Promise.all(relativos.map((r) => unlink(caminhoAbsoluto(r)).catch(() => {})));
}
