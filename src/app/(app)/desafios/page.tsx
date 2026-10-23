import Link from "next/link";
import { ChevronRight, Plus, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { calcularPlacar, statusDoDesafio, type StatusDoDesafio } from "@/lib/desafios";
import { deDate, diferencaEmDias, hoje, rotuloCurto } from "@/lib/datas";
import { Topo } from "@/componentes/Topo";
import { Vazio } from "@/componentes/Vazio";

export const metadata = { title: "Desafios" };

const TITULOS: Record<StatusDoDesafio, string> = {
  ativo: "Valendo agora",
  agendado: "Vão começar",
  encerrado: "Encerrados",
};

export default async function PaginaDesafios() {
  const { usuario, familia } = await exigirFamilia();
  const desafios = await prisma.desafio.findMany({
    where: { familiaId: familia.id },
    orderBy: { dataFim: "desc" },
    include: {
      _count: { select: { participantes: true } },
      participantes: { where: { usuarioId: usuario.id }, select: { usuarioId: true } },
    },
  });

  const grupos: Record<StatusDoDesafio, typeof desafios> = { ativo: [], agendado: [], encerrado: [] };
  for (const d of desafios) grupos[statusDoDesafio(d)].push(d);

  // Só os ativos precisam do placar na lista (posição e progresso).
  const placares = new Map(
    await Promise.all(grupos.ativo.map(async (d) => [d.id, await calcularPlacar(d)] as const)),
  );

  return (
    <div>
      <Topo
        titulo="Desafios"
        sobretitulo={familia.nome}
        acao={
          desafios.length > 0 && (
            <Link href="/desafios/novo" className="btn-primario min-h-11 px-4">
              <Plus className="size-5" /> Novo
            </Link>
          )
        }
      />

      {desafios.length === 0 && (
        <Vazio
          icone={Trophy}
          titulo="Nenhum desafio ainda"
          texto="Combine um prazo e um prêmio. Vence quem treinar em mais dias."
        >
          <Link href="/desafios/novo" className="btn-primario w-full">
            Criar o primeiro desafio
          </Link>
        </Vazio>
      )}

      <div className="space-y-6">
        {(Object.keys(grupos) as StatusDoDesafio[]).map(
          (status) =>
            grupos[status].length > 0 && (
              <section key={status} className="space-y-3">
                <h2 className="subtitulo">{TITULOS[status]}</h2>
                {grupos[status].map((d) => {
                  const placar = placares.get(d.id);
                  const minha = placar?.linhas.find((l) => l.usuarioId === usuario.id);
                  const restam = diferencaEmDias(hoje(), deDate(d.dataFim));
                  return (
                    <Link
                      key={d.id}
                      href={`/desafios/${d.id}`}
                      className={`cartao flex items-center gap-4 p-4 transition-transform active:scale-[0.99] ${
                        status === "encerrado" ? "opacity-75" : ""
                      }`}
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-marca-suave text-marca-forte">
                        <Trophy className="size-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-normal">{d.titulo}</span>
                        <span className="block truncate text-sm text-suave">{d.premio}</span>
                        {placar ? (
                          <>
                            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-superficie-2">
                              <span
                                className="block h-full rounded-full bg-marca"
                                style={{ width: `${(placar.diasDecorridos / placar.totalDias) * 100}%` }}
                              />
                            </span>
                            <span className="mt-1.5 block text-xs font-medium text-suave">
                              {restam === 0 ? "Último dia" : `Faltam ${restam} dia${restam === 1 ? "" : "s"}`}
                              {minha && ` · você está em ${minha.posicao}º`}
                            </span>
                          </>
                        ) : (
                          <span className="mt-1 block text-xs font-medium text-suave">
                            {rotuloCurto(deDate(d.dataInicio))} → {rotuloCurto(deDate(d.dataFim))} ·{" "}
                            {d._count.participantes} participante{d._count.participantes === 1 ? "" : "s"}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-suave" />
                    </Link>
                  );
                })}
              </section>
            ),
        )}
      </div>
    </div>
  );
}
