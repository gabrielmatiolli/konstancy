import { prisma } from "@/lib/prisma";
import { usuarioLogado } from "@/lib/auth";
import { caminhoDoAvatar, lerFoto } from "@/lib/fotos";

/**
 * Foto de perfil — visível para a própria pessoa e para quem divide alguma
 * família com ela. A versão na URL (?v=) só serve para furar o cache; o
 * arquivo servido é sempre o da versão atual no banco.
 */
export async function GET(_: Request, { params }: RouteContext<"/api/avatar/[id]">) {
  const visitante = await usuarioLogado();
  if (!visitante) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const alvo = await prisma.usuario.findFirst({
    where: {
      id,
      OR: [
        { id: visitante.id },
        { membros: { some: { familia: { membros: { some: { usuarioId: visitante.id } } } } } },
      ],
    },
    select: { avatarVersao: true },
  });
  if (!alvo || alvo.avatarVersao === 0) return new Response("Não encontrado", { status: 404 });

  try {
    const arquivo = await lerFoto(caminhoDoAvatar(id, alvo.avatarVersao));
    return new Response(new Uint8Array(arquivo), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Arquivo não encontrado", { status: 404 });
  }
}
