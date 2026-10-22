import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { calcularPlacar, statusDoDesafio } from "@/lib/desafios";
import { deDate, rotuloCurto } from "@/lib/datas";
import { apagarDesafio, deixarDeParticipar, participar } from "@/acoes/desafios";
import { Avatar } from "@/componentes/Avatar";
import { BotaoConfirmar } from "@/componentes/BotaoConfirmar";

export const metadata = { title: "Desafio" };

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

  return (
    <div className="space-y-6">
      <Link href="/desafios" className="text-sm text-suave">
        ← Desafios
      </Link>

      <header className="space-y-1">
        <h1 className="titulo-pagina">{desafio.titulo}</h1>
        <p className="text-lg">🏆 {desafio.premio}</p>
        <p className="text-sm text-suave">
          {rotuloCurto(deDate(desafio.dataInicio))} → {rotuloCurto(deDate(desafio.dataFim))} · criado por{" "}
          {desafio.criador.nome}
        </p>
        {desafio.descricao && <p className="pt-2 text-sm whitespace-pre-line">{desafio.descricao}</p>}
      </header>

      {status === "encerrado" ? (
        <section className="cartao p-4 text-center">
          {vencedores.length > 0 ? (
            <>
              <p className="text-sm text-suave">{vencedores.length > 1 ? "Empate! Vencedores" : "Vencedor"}</p>
              <p className="text-2xl font-bold">{vencedores.map((v) => v.nome).join(" e ")}</p>
              <p className="text-sm text-suave">{vencedores[0].dias} dias com check-in</p>
            </>
          ) : (
            <p className="text-suave">Encerrado sem check-ins.</p>
          )}
        </section>
      ) : (
        <section aria-label="Andamento">
          <div className="mb-1 flex justify-between text-xs text-suave">
            <span>{status === "agendado" ? "Ainda não começou" : `Dia ${placar.diasDecorridos} de ${placar.totalDias}`}</span>
            <span>{progresso}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-borda">
            <div className="h-full bg-marca" style={{ width: `${progresso}%` }} />
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Placar</h2>
        <ol className="cartao divide-y divide-borda">
          {placar.linhas.map((l) => (
            <li key={l.usuarioId} className="flex items-center gap-3 p-3">
              <span className="w-5 text-center text-sm font-semibold text-suave tabular-nums">{l.posicao}º</span>
              <Avatar usuario={{ id: l.usuarioId, nome: l.nome }} tamanho={32} />
              <span className="min-w-0 flex-1 truncate">
                {l.usuarioId === usuario.id ? "Você" : l.nome}
                {status !== "encerrado" && l.sequencia >= 2 &&<span className="ml-2 text-xs text-suave">🔥 {l.sequencia} seguidos</span>}
              </span>
              <span className="text-right">
                <span className="font-semibold tabular-nums">{l.dias}</span>
                <span className="text-xs text-suave">/{placar.totalDias}</span>
              </span>
            </li>
          ))}
          {placar.linhas.length === 0 && <li className="p-3 text-sm text-suave">Ninguém participando ainda.</li>}
        </ol>
      </section>

      {status !== "encerrado" &&
        (participo ? (
          <BotaoConfirmar
            acao={deixarDeParticipar.bind(null, desafio.id)}
            pergunta="Sair deste desafio?"
            className="btn w-full"
          >
            Sair do desafio
          </BotaoConfirmar>
        ) : (
          <form action={participar.bind(null, desafio.id)}>
            <button className="btn-primario w-full">Participar</button>
          </form>
        ))}

      {(desafio.criadorId === usuario.id || papel === "ADMIN") && (
        <BotaoConfirmar
          acao={apagarDesafio.bind(null, desafio.id)}
          pergunta="Apagar este desafio? Os check-ins continuam, só o desafio some."
          className="btn-perigo w-full"
        >
          Apagar desafio
        </BotaoConfirmar>
      )}
    </div>
  );
}
