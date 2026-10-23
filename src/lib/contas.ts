import "server-only";
import { prisma } from "@/lib/prisma";
import { ehEmail, normalizarTelefone } from "@/lib/telefone";

/**
 * Login e recuperação aceitam e-mail ou celular (em qualquer formato).
 * Fica fora de `acoes/`: exportada de um arquivo "use server", viraria uma
 * ação chamável pelo navegador — e devolve o hash da senha.
 */
export async function buscarPorIdentificador(identificador: string) {
  const selecao = { id: true, nome: true, email: true, senhaHash: true, versaoSessao: true } as const;
  if (ehEmail(identificador)) {
    return prisma.usuario.findUnique({ where: { email: identificador.trim().toLowerCase() }, select: selecao });
  }
  const telefone = normalizarTelefone(identificador);
  return telefone ? prisma.usuario.findUnique({ where: { telefone }, select: selecao }) : null;
}
