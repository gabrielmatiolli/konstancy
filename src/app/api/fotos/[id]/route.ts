import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { usuarioLogado } from "@/lib/auth";
import { ehMembro } from "@/lib/familia";
import { lerFoto } from "@/lib/fotos";
import { deveBorrar, jaFezCheckinHoje } from "@/lib/consultas";

/**
 * Fotos de check-in só para membros da família. `?v=thumb` serve a miniatura.
 * Foto de hoje de outra pessoa sai borrada no servidor enquanto quem pede não
 * postou a sua (quando a família usa o modo BeReal).
 */
export async function GET(request: Request, { params }: RouteContext<"/api/fotos/[id]">) {
  const usuario = await usuarioLogado();
  if (!usuario) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const checkin = await prisma.checkin.findUnique({
    where: { id },
    select: {
      fotoPath: true,
      thumbPath: true,
      dia: true,
      usuarioId: true,
      familiaId: true,
      familia: { select: { borrarAtePostar: true } },
    },
  });
  if (!checkin || !(await ehMembro(usuario.id, checkin.familiaId))) {
    return new Response("Não encontrado", { status: 404 });
  }

  // A versão borrada tem URL própria (?v=borrada): o cache do navegador é por
  // URL, não por conta — num celular compartilhado, a URL nítida já baixada por
  // quem postou seria reaproveitada para quem ainda não postou.
  const versao = new URL(request.url).searchParams.get("v");
  const thumb = versao === "thumb";
  const borrar =
    versao === "borrada" ||
    deveBorrar(
      checkin,
      { id: usuario.id, postouHoje: await jaFezCheckinHoje(checkin.familiaId, usuario.id) },
      checkin.familia.borrarAtePostar,
    );

  let arquivo: Buffer;
  try {
    // Borrada sai sempre da miniatura: não adianta pedir a grande.
    arquivo = await lerFoto(thumb || borrar ? checkin.thumbPath : checkin.fotoPath);
  } catch {
    return new Response("Arquivo não encontrado", { status: 404 });
  }
  if (borrar) arquivo = await sharp(arquivo).blur(25).webp({ quality: 40 }).toBuffer();

  return new Response(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "image/webp",
      // Nítida e ?v=borrada nunca mudam de conteúdo. Já a URL nítida servida
      // borrada (alguém pedindo antes de postar) não pode ficar no cache.
      "Cache-Control":
        borrar && versao !== "borrada" ? "private, no-store" : "private, max-age=31536000, immutable",
    },
  });
}
