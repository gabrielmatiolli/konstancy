import Link from "next/link";
import { CalendarCheck, Camera, ChevronRight, Flame, LogOut, Pencil, UserPen, Users } from "lucide-react";
import { formatarTelefone } from "@/lib/telefone";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { deDate, hoje, somarDias } from "@/lib/datas";
import { sair } from "@/acoes/auth";
import { Avatar } from "@/componentes/Avatar";
import { AtivarNotificacoes } from "@/componentes/AtivarNotificacoes";
import { InstalarApp } from "@/componentes/InstalarApp";

export const metadata = { title: "Perfil" };

export default async function PaginaPerfil() {
  const { usuario, familia } = await exigirFamilia();

  const [dias, total] = await Promise.all([
    prisma.checkin.groupBy({
      by: ["dia"],
      where: { usuarioId: usuario.id, familiaId: familia.id },
      orderBy: { dia: "desc" },
    }),
    prisma.checkin.count({ where: { usuarioId: usuario.id, familiaId: familia.id } }),
  ]);
  const conjunto = new Set(dias.map((d) => deDate(d.dia)));

  let sequencia = 0;
  for (let d = conjunto.has(hoje()) ? hoje() : somarDias(hoje(), -1); conjunto.has(d); d = somarDias(d, -1)) sequencia++;

  const numeros = [
    { valor: sequencia, rotulo: "seguidos", Icone: Flame, cor: "text-marca-forte" },
    { valor: conjunto.size, rotulo: "dias ativos", Icone: CalendarCheck, cor: "text-marca-forte" },
    { valor: total, rotulo: "check-ins", Icone: Camera, cor: "text-suave" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-center pt-4 text-center">
        <Link href="/perfil/editar" aria-label="Editar perfil e foto" className="relative rounded-full active:scale-95">
          <Avatar usuario={usuario} tamanho={88} />
          <span className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full border-[3px] border-fundo bg-superficie-2 text-texto">
            <Pencil className="size-3.5" />
          </span>
        </Link>
        <h1 className="mt-3 text-2xl font-light">{usuario.nome}</h1>
        <p className="text-sm text-suave">
          {usuario.email}
          {usuario.telefone && ` · ${formatarTelefone(usuario.telefone)}`}
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {numeros.map(({ valor, rotulo, Icone, cor }) => (
          <div key={rotulo} className="cartao flex flex-col items-center px-2 py-4">
            <Icone className={`mb-1 size-5 ${cor}`} />
            <p className="numero text-[34px] leading-tight">{valor}</p>
            <p className="text-xs font-medium text-suave">{rotulo}</p>
          </div>
        ))}
      </section>

      <AtivarNotificacoes />
      <InstalarApp />

      <nav className="cartao divide-y divide-borda overflow-hidden">
        <Link href="/perfil/editar" className="flex min-h-16 items-center gap-4 px-4 active:bg-superficie-2">
          <UserPen className="size-5 text-suave" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Editar perfil</span>
            <span className="block truncate text-sm text-suave">Foto, nome, e-mail e celular</span>
          </span>
          {!usuario.emailVerificado && <span className="size-2.5 rounded-full bg-perigo" aria-label="E-mail não confirmado" />}
          <ChevronRight className="size-5 text-suave" />
        </Link>
        <Link href="/familia" className="flex min-h-16 items-center gap-4 px-4 active:bg-superficie-2">
          <Users className="size-5 text-suave" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Família</span>
            <span className="block truncate text-sm text-suave">{familia.nome} · convite e membros</span>
          </span>
          <ChevronRight className="size-5 text-suave" />
        </Link>
        <form action={sair}>
          <button className="flex min-h-16 w-full items-center gap-4 px-4 text-left font-medium text-perigo active:bg-superficie-2">
            <LogOut className="size-5" /> Sair da conta
          </button>
        </form>
      </nav>
    </div>
  );
}
