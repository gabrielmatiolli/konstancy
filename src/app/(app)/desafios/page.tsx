import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { statusDoDesafio, type StatusDoDesafio } from "@/lib/desafios";
import { deDate, rotuloCurto } from "@/lib/datas";

export const metadata = { title: "Desafios" };

const TITULOS: Record<StatusDoDesafio, string> = {
  ativo: "Em andamento",
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

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="titulo-pagina">Desafios</h1>
        <Link href="/desafios/novo" className="btn-primario">
          Novo desafio
        </Link>
      </header>

      {desafios.length === 0 && (
        <p className="py-10 text-center text-suave">
          Nenhum desafio ainda. Crie um com data de fim e um prêmio para quem treinar mais dias!
        </p>
      )}

      {(Object.keys(grupos) as StatusDoDesafio[]).map(
        (status) =>
          grupos[status].length > 0 && (
            <section key={status} className="space-y-3">
              <h2 className="text-sm font-semibold text-suave uppercase">{TITULOS[status]}</h2>
              {grupos[status].map((d) => (
                <Link key={d.id} href={`/desafios/${d.id}`} className="cartao block p-4">
                  <p className="font-semibold">{d.titulo}</p>
                  <p className="text-sm">🏆 {d.premio}</p>
                  <p className="mt-1 text-xs text-suave">
                    {rotuloCurto(deDate(d.dataInicio))} → {rotuloCurto(deDate(d.dataFim))} · {d._count.participantes}{" "}
                    participante{d._count.participantes === 1 ? "" : "s"}
                    {d.participantes.length > 0 && " · você está dentro"}
                  </p>
                </Link>
              ))}
            </section>
          ),
      )}
    </div>
  );
}
