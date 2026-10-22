import { notFound } from "next/navigation";
import { CalendarDays, Flame, Gift, Trash, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { calcularPlacar, statusDoDesafio } from "@/lib/desafios";
import { deDate, diferencaEmDias, hoje, rotuloCurto } from "@/lib/datas";
import { apagarDesafio, deixarDeParticipar, participar } from "@/acoes/desafios";
import { Avatar } from "@/componentes/Avatar";
import { BotaoConfirmar } from "@/componentes/BotaoConfirmar";
import { Topo } from "@/componentes/Topo";

export const metadata = { title: "Desafio" };

const MEDALHAS = ["bg-ouro", "bg-prata", "bg-bronze"];

export default async function PaginaDesafio({ params }: PageProps<"/desafios/[id]">) {
  const { usuario, familia, papel } = await exigirFamilia();
  const { id } = await params;

  const desafio = await prisma.desafio.findFirst({
    where: { id, familiaId: familia.id },
    include: { criador: { select: { nome: true } } },
  });
  if (!desafio) notFound();

  const status = statusDoDesafio(desafio);
  const placar = await calcularPlacar(desafio);
  const participo = placar.linhas.some((l) => l.usuarioId === usuario.id);
  const vencedores = placar.linhas.filter((l) => placar.lideres.includes(l.usuarioId));
  const progresso = Math.round((placar.diasDecorridos / placar.totalDias) * 100);
  const restam = diferencaEmDias(hoje(), deDate(desafio.dataFim));
  const podeApagar = desafio.criadorId === usuario.id || papel === "ADMIN";

  return (
    <div className="space-y-5">
      <Topo
        voltar="/desafios"
        titulo={desafio.titulo}
        acao={
          podeApagar && (
            <BotaoConfirmar
              acao={apagarDesafio.bind(null, desafio.id)}
              pergunta="Apagar este desafio?"
              detalhe="Os check-ins continuam no feed; só o desafio e o placar somem."
              textoConfirmar="Apagar"
              className="btn-icone text-suave"
            >
              <Trash className="size-5" aria-label="Apagar desafio" />
            </BotaoConfirmar>
          )
        }
      />

      <section className="cartao space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ouro/15 text-ouro">
            <Gift className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-suave uppercase">Prêmio</p>
            <p className="font-bold">{desafio.premio}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-superficie-2 text-suave">
            <CalendarDays className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-suave uppercase">
              {rotuloCurto(deDate(desafio.dataInicio))} até {rotuloCurto(deDate(desafio.dataFim))}
            </p>
            <p className="font-bold">
              {status === "encerrado"
                ? "Encerrado"
                : status === "agendado"
                  ? "Ainda não começou"
                  : restam === 0
                    ? "Último dia!"
                    : `Dia ${placar.diasDecorridos} de ${placar.totalDias} · faltam ${restam}`}
            </p>
          </div>
        </div>
        {status === "ativo" && (
          <div className="h-2 overflow-hidden rounded-full bg-superficie-2" aria-label={`${progresso}% do período`}>
            <div className="h-full rounded-full bg-marca" style={{ width: `${progresso}%` }} />
          </div>
        )}
        {desafio.descricao && <p className="text-sm whitespace-pre-line text-suave">{desafio.descricao}</p>}
        <p className="text-xs text-suave">
          Criado por {desafio.criador.nome}. Vence quem fizer check-in em mais dias diferentes.
        </p>
      </section>

      {status === "encerrado" && (
        <section className="flex flex-col items-center rounded-3xl bg-ouro/12 p-5 text-center">
          <Trophy className="mb-2 size-9 text-ouro" />
          {vencedores.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-suave">{vencedores.length > 1 ? "Empate! Vencedores" : "Vencedor"}</p>
              <p className="text-2xl font-extrabold">{vencedores.map((v) => v.nome).join(" e ")}</p>
              <p className="text-sm text-suave">{vencedores[0].dias} dias com check-in</p>
            </>
          ) : (
            <p className="font-semibold text-suave">Encerrado sem check-ins.</p>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="subtitulo">Placar</h2>
        <ol className="cartao divide-y divide-borda overflow-hidden">
          {placar.linhas.map((l) => {
            const eu = l.usuarioId === usuario.id;
            return (
              <li key={l.usuarioId} className={`flex items-center gap-3 px-4 py-3 ${eu ? "bg-marca-suave/60" : ""}`}>
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold tabular-nums ${
                    l.dias > 0 && l.posicao <= 3 ? `${MEDALHAS[l.posicao - 1]} text-white` : "bg-superficie-2 text-suave"
                  }`}
                >
                  {l.posicao}
                </span>
                <Avatar usuario={{ id: l.usuarioId, nome: l.nome }} tamanho={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{eu ? "Você" : l.nome}</span>
                  {status !== "encerrado" && l.sequencia >= 2 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-fogo">
                      <Flame className="size-3.5" /> {l.sequencia} dias seguidos
                    </span>
                  )}
                </span>
                <span className="text-right tabular-nums">
                  <span className="text-lg font-extrabold">{l.dias}</span>
                  <span className="text-xs text-suave"> dias</span>
                </span>
              </li>
            );
          })}
          {placar.linhas.length === 0 && <li className="p-4 text-sm text-suave">Ninguém participando ainda.</li>}
        </ol>
      </section>

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
