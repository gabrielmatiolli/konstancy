import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { deDate, hoje, somarDias } from "@/lib/datas";
import { sair } from "@/acoes/auth";
import { Avatar } from "@/componentes/Avatar";
import { AtivarNotificacoes } from "@/componentes/AtivarNotificacoes";

export const metadata = { title: "Perfil" };

export default async function PaginaPerfil() {
  const { usuario, familia } = await exigirFamilia();

  const dias = await prisma.checkin.groupBy({
    by: ["dia"],
    where: { usuarioId: usuario.id, familiaId: familia.id },
    orderBy: { dia: "desc" },
  });
  const conjunto = new Set(dias.map((d) => deDate(d.dia)));

  let sequencia = 0;
  for (let d = conjunto.has(hoje()) ? hoje() : somarDias(hoje(), -1); conjunto.has(d); d = somarDias(d, -1)) sequencia++;

  const total = await prisma.checkin.count({ where: { usuarioId: usuario.id, familiaId: familia.id } });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Avatar usuario={usuario} tamanho={64} />
        <div className="min-w-0">
          <h1 className="titulo-pagina truncate">{usuario.nome}</h1>
          <p className="truncate text-sm text-suave">{usuario.email}</p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          { valor: sequencia, rotulo: "dias seguidos" },
          { valor: conjunto.size, rotulo: "dias ativos" },
          { valor: total, rotulo: "check-ins" },
        ].map((s) => (
          <div key={s.rotulo} className="cartao p-3">
            <p className="text-2xl font-bold tabular-nums">{s.valor}</p>
            <p className="text-xs text-suave">{s.rotulo}</p>
          </div>
        ))}
      </section>

      <section className="cartao p-4">
        <h2 className="mb-2 font-semibold">Notificações</h2>
        <AtivarNotificacoes />
      </section>

      <Link href="/familia" className="cartao flex items-center justify-between p-4">
        <span>
          <span className="block font-semibold">Família</span>
          <span className="text-sm text-suave">{familia.nome} · convite e membros</span>
        </span>
        <span aria-hidden>›</span>
      </Link>

      <form action={sair}>
        <button className="btn w-full">Sair da conta</button>
      </form>
    </div>
  );
}
