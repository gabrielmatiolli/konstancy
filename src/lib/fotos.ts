import "server-only";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import { armazenamento } from "@/lib/armazenamento";

/**
 * Tratamento das fotos (sharp) e gravação no armazenamento — bucket R2 em
 * produção, pasta local em dev (ver armazenamento.ts). As chaves guardadas no
 * banco (fotoPath, thumbPath) são as mesmas nos dois.
 */

/**
 * A Vercel recusa requisições acima de 4,5 MB. O celular comprime antes
 * (~300 KB); este limite só pega o caso raro em que a compressão falhou e o
 * original foi mandado.
 */
export const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const MENSAGEM_GRANDE = "Foto grande demais. Tente tirar outra ou escolher uma menor.";

/*
 * Três tamanhos, pensando em Android de entrada no 4G:
 *   grande  1440px — só na tela do check-in, para dar zoom
 *   média    720px — o feed (360px de tela × densidade 2), ~5× mais leve que a grande
 *   miniatura 240px quadrada — células do painel e base da versão borrada
 */
const LADO_FOTO = 1440;
const LADO_MEDIA = 720;
const LADO_THUMB = 240;
const WEBP = "image/webp";

export interface FotoSalva {
  fotoPath: string;
  thumbPath: string;
  largura: number;
  altura: number;
}

/**
 * Normaliza a foto (gira conforme o EXIF, remove metadados — inclusive GPS —
 * e converte para WebP) e grava a grande, a média e a miniatura.
 */
export async function salvarFoto(arquivo: File, id: string, dia: string): Promise<FotoSalva> {
  if (arquivo.size === 0) throw new Error("Foto vazia.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error(MENSAGEM_GRANDE);

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

  const { data: foto, info } = await base
    .clone()
    .resize(LADO_FOTO, LADO_FOTO, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const [media, thumb] = await Promise.all([
    gerarMedia(foto),
    base.clone().resize(LADO_THUMB, LADO_THUMB, { fit: "cover" }).webp({ quality: 65 }).toBuffer(),
  ]);

  const loja = armazenamento();
  await Promise.all([
    loja.gravar(fotoPath, foto, WEBP),
    loja.gravar(caminhoDaMedia(fotoPath), media, WEBP),
    loja.gravar(thumbPath, thumb, WEBP),
  ]);

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

export function lerFoto(chave: string) {
  return armazenamento().ler(chave);
}

/**
 * Lê a versão média; check-ins anteriores a ela ganham a sua na primeira
 * leitura, gerada a partir da grande.
 */
export async function lerMedia(fotoPath: string) {
  const mediaPath = caminhoDaMedia(fotoPath);
  try {
    return await armazenamento().ler(mediaPath);
  } catch {
    const media = await gerarMedia(await lerFoto(fotoPath));
    await armazenamento().gravar(mediaPath, media, WEBP).catch(() => {});
    return media;
  }
}

export async function apagarFotos(...chaves: string[]) {
  const loja = armazenamento();
  await Promise.all(chaves.map((c) => loja.apagar(c).catch(() => {})));
}

// ---------------------------------------------------------------------------
// Foto de perfil
// ---------------------------------------------------------------------------

const LADO_AVATAR = 256;

/** Um arquivo por versão: a URL carrega a versão e o cache longo nunca serve a foto velha. */
export function caminhoDoAvatar(usuarioId: string, versao: number) {
  return path.posix.join("avatares", `${usuarioId}-${versao}.webp`);
}

/** Recorte quadrado de 256px (rosto no centro), sem EXIF/GPS — ~10 KB. */
export async function salvarAvatar(arquivo: File, usuarioId: string, versao: number) {
  if (arquivo.size === 0) throw new Error("Foto vazia.");
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error(MENSAGEM_GRANDE);

  let saida: Buffer;
  try {
    saida = await sharp(Buffer.from(await arquivo.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize(LADO_AVATAR, LADO_AVATAR, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new Error("Arquivo não é uma imagem válida.");
  }

  await armazenamento().gravar(caminhoDoAvatar(usuarioId, versao), saida, WEBP);
}
