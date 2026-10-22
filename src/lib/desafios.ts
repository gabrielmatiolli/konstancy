import "server-only";
import { prisma } from "@/lib/prisma";
import { deDate, diasEntre, diferencaEmDias, hoje, paraDate, somarDias } from "@/lib/datas";

export type StatusDoDesafio = "agendado" | "ativo" | "encerrado";

export function statusDoDesafio(desafio: { dataInicio: Date; dataFim: Date }, dia = hoje()): StatusDoDesafio {
  if (dia < deDate(desafio.dataInicio)) return "agendado";
  if (dia > deDate(desafio.dataFim)) return "encerrado";
  return "ativo";
}

export interface LinhaDoPlacar {
  usuarioId: string;
  nome: string;
  /** Dias com pelo menos um check-in dentro do período do desafio. */
  dias: number;
  /** Dias seguidos com check-in, terminando hoje ou ontem. */
  sequencia: number;
  posicao: number;
}

export interface Placar {
  linhas: LinhaDoPlacar[];
  totalDias: number;
  diasDecorridos: number;
  /** Quem tem o maior número de dias (pode haver empate). Vazio se ninguém pontuou. */
  lideres: string[];
}

/**
 * Regra do desafio: vence quem fizer check-in em mais dias distintos entre
 * dataInicio e dataFim. Vários check-ins no mesmo dia contam uma vez. Empate
 * divide o prêmio — a família resolve como quiser.
 */
export async function calcularPlacar(desafio: {
  id: string;
  familiaId: string;
  dataInicio: Date;
  dataFim: Date;
}): Promise<Placar> {
  const inicio = deDate(desafio.dataInicio);
  const fim = deDate(desafio.dataFim);
  const ateHoje = hoje() < fim ? hoje() : fim;

  const participantes = await prisma.participante.findMany({
    where: { desafioId: desafio.id },
    select: { usuario: { select: { id: true, nome: true } } },
  });
  const ids = participantes.map((p) => p.usuario.id);

  const diasComCheckin = ids.length
    ? await prisma.checkin.groupBy({
        by: ["usuarioId", "dia"],
        where: {
          familiaId: desafio.familiaId,
          usuarioId: { in: ids },
          dia: { gte: paraDate(inicio), lte: paraDate(fim) },
        },
      })
    : [];

  const porUsuario = new Map<string, Set<string>>();
  for (const { usuarioId, dia } of diasComCheckin) {
    if (!porUsuario.has(usuarioId)) porUsuario.set(usuarioId, new Set());
    porUsuario.get(usuarioId)!.add(deDate(dia));
  }

  const linhas = participantes
    .map(({ usuario }) => {
      const dias = porUsuario.get(usuario.id) ?? new Set<string>();
      return { usuarioId: usuario.id, nome: usuario.nome, dias: dias.size, sequencia: sequenciaAtual(dias, ateHoje) };
    })
    .sort((a, b) => b.dias - a.dias || b.sequencia - a.sequencia || a.nome.localeCompare(b.nome, "pt-BR"));

  // Posição de competição: empatados dividem a posição (1, 1, 3...).
  const comPosicao: LinhaDoPlacar[] = linhas.map((linha, i) => ({
    ...linha,
    posicao: i > 0 && linhas[i - 1].dias === linha.dias ? 0 : i + 1,
  }));
  for (let i = 1; i < comPosicao.length; i++) {
    if (comPosicao[i].posicao === 0) comPosicao[i].posicao = comPosicao[i - 1].posicao;
  }

  const maximo = linhas[0]?.dias ?? 0;
  return {
    linhas: comPosicao,
    totalDias: diferencaEmDias(inicio, fim) + 1,
    diasDecorridos: ateHoje < inicio ? 0 : diasEntre(inicio, ateHoje).length,
    lideres: maximo > 0 ? linhas.filter((l) => l.dias === maximo).map((l) => l.usuarioId) : [],
  };
}

/** Conta para trás a partir de hoje; se hoje ainda não teve check-in, começa de ontem. */
function sequenciaAtual(dias: Set<string>, ate: string) {
  let dia = dias.has(ate) ? ate : somarDias(ate, -1);
  let n = 0;
  while (dias.has(dia)) {
    n++;
    dia = somarDias(dia, -1);
  }
  return n;
}
