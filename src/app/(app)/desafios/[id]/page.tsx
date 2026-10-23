import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Gift, Trash, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { calcularPlacar, statusDoDesafio } from "@/lib/desafios";
import { deDate, diasEntre, diferencaEmDias, hoje, rotuloCurto, somarDias } from "@/lib/datas";
import { apagarDesafio, deixarDeParticipar, participar } from "@/acoes/desafios";
import { BotaoConfirmar } from "@/componentes/BotaoConfirmar";
import { GradeDias, type LinhaDaGrade } from "@/componentes/GradeDias";

export const metadata = { title: "Desafio" };

/** Quantos dias cabem na grade do placar numa tela de celular. */
const COLUNAS_MAX = 7;

export default async function PaginaDesafio({ params }: PageProps<"/desafios/[id]">) {
  const { usuario, familia, papel } = await exigirFamilia();
  const { id } = await params;

  const desafio = await prisma.desafio.findFirst({
    where: { id, familiaId: familia.id },
    include: { criador: { select: { nome: true } } },
  });
  if (!desafio) notFound();

  const dia = hoje();
  const inicio = deDate(desafio.dataInicio);
  const fim = deDate(desafio.dataFim);
  const status = statusDoDesafio(desafio);
  const placar = await calcularPlacar(desafio);
  const participo = placar.linhas.some((l) => l.usuarioId === usuario.id);
  const vencedores = placar.linhas.filter((l) => placar.lideres.includes(l.usuarioId));
  const restam = diferencaEmDias(dia, fim);
  const podeApagar = desafio.criadorId === usuario.id || papel === "ADMIN";

  // Desafio de até 7 dias: a grade mostra todos. Mais longo: os últimos 7 até hoje
  // (ou os 7 primeiros, se ainda não começou).
  const todos = diasEntre(inicio, fim);
  const recorte = todos.length > COLUNAS_MAX;
  const ate = status === "agendado" ? somarDias(inicio, COLUNAS_MAX - 1) : dia < fim ? dia : fim;
  const colunas = recorte ? diasEntre(somarDias(ate, -(COLUNAS_MAX - 1)), ate) : todos;

  const linhas: LinhaDaGrade[] = placar.linhas.map((l) => ({
    pessoa: { id: l.usuarioId, nome: l.nome, avatarVersao: l.avatarVersao },
    dias: l.datas,
    total: l.dias,
    posicao: `${l.posicao}º`,
    lider: placar.lideres.includes(l.usuarioId),
  }));

  const rotuloTopo =
    status === "encerrado"
      ? "ENCERRADO"
      : status === "agendado"
        ? `COMEÇA ${rotuloCurto(inicio)}`
        : `DIA ${placar.diasDecorridos} DE ${placar.totalDias}`;

  return (
    <div className="space-y-4">
      <section
        aria-label="Placar do desafio"
        className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] space-y-4 rounded-b-3xl bg-floresta px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-5 text-white"
      >
        <div className="flex items-center justify-between">
          <Link href="/desafios" aria-label="Voltar para desafios" className="btn-icone -ml-3 text-white active:bg-floresta-2">
            <ChevronLeft className="size-6" strokeWidth={1.6} />
          </Link>
          <span className="text-[11px] font-semibold tracking-[0.14em] text-marca">{rotuloTopo}</span>
          {podeApagar ? (
            <BotaoConfirmar
              acao={apagarDesafio.bind(null, desafio.id)}
              pergunta="Apagar este desafio?"
              detalhe="Os check-ins continuam no feed; só o desafio e o placar somem."
              textoConfirmar="Apagar"
              className="btn-icone -mr-3 text-sobre-floresta active:bg-floresta-2"
            >
              <Trash className="size-5" strokeWidth={1.6} aria-label="Apagar desafio" />
            </BotaoConfirmar>
          ) : (
            <span className="size-11" aria-hidden />
          )}
        </div>

        <h1 className="text-[28px] leading-[1.05] font-light tracking-[-0.02em]">{desafio.titulo}</h1>

        {status === "encerrado" && (
          <p className="flex items-center gap-2 text-[15px]">
            <Trophy className="size-5 shrink-0 text-marca" strokeWidth={1.6} />
            {vencedores.length > 0 ? (
              <span>
                {vencedores.length > 1 ? "Empate entre " : "Venceu "}
                <span className="font-medium">{vencedores.map((v) => v.nome.split(" ")[0]).join(" e ")}</span>, com{" "}
                {vencedores[0].dias} dias.
              </span>
            ) : (
              <span className="text-sobre-floresta">Encerrado sem check-ins.</span>
            )}
          </p>
        )}

        <div className="border-t border-floresta-linha pt-3.5">
          {recorte && <p className="mb-2 text-[11px] font-medium tracking-[0.1em] text-sobre-floresta">ÚLTIMOS 7 DIAS · TOTAL À DIREITA</p>}
          {linhas.length > 0 ? (
            <GradeDias linhas={linhas} colunas={colunas} hoje={dia} euId={usuario.id} tamanho={24} rotulo="Placar do desafio por dia" />
          ) : (
            <p className="text-sm text-sobre-floresta">Ninguém participando ainda.</p>
          )}
        </div>
      </section>

      <div className="cartao flex items-center gap-3.5 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-suave text-marca-forte">
          <Gift className="size-5" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <p className="subtitulo">Prêmio</p>
          <p className="mt-0.5 text-[17px] font-normal">{desafio.premio}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="cartao p-4">
          <p className="subtitulo">{status === "agendado" ? "Começa em" : "Faltam"}</p>
          <p className="mt-1">
            <span className="numero text-[34px] leading-none">
              {status === "encerrado" ? 0 : status === "agendado" ? diferencaEmDias(dia, inicio) : restam}
            </span>{" "}
            <span className="text-[15px]">dias</span>
          </p>
        </div>
        <div className="cartao p-4">
          <p className="subtitulo">Período</p>
          <p className="mt-2.5 text-[15px] font-normal">
            {rotuloCurto(inicio)} → {rotuloCurto(fim)}
          </p>
        </div>
      </div>

      {desafio.descricao && <p className="px-1 text-sm whitespace-pre-line text-suave">{desafio.descricao}</p>}
      <p className="px-1 text-sm leading-relaxed text-suave">
        Vence quem preencher mais dias. Dois treinos no mesmo dia contam como um. Criado por{" "}
        {desafio.criador.nome.split(" ")[0]}.
      </p>

      {status !== "encerrado" &&
        (participo ? (
          <BotaoConfirmar
            acao={deixarDeParticipar.bind(null, desafio.id)}
            pergunta="Sair deste desafio?"
            detalhe="Seus check-ins continuam valendo se você entrar de novo."
            textoConfirmar="Sair"
            className="btn-suave w-full"
          >
            Sair do desafio
          </BotaoConfirmar>
        ) : (
          <form action={participar.bind(null, desafio.id)}>
            <button className="btn-primario w-full">Participar do desafio</button>
          </form>
        ))}
    </div>
  );
}
