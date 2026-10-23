import Link from "next/link";
import { ArrowRight, Camera, CheckCircle2, ChevronRight, MailWarning, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { selecaoPessoa } from "@/lib/pessoa";
import { exigirFamilia } from "@/lib/familia";
import { checkinsDaFamilia, deveBorrar, type CheckinDoCartao } from "@/lib/consultas";
import { deDate, diasEntre, hoje, inicioDaSemana, rotuloDataCurta, rotuloDia, somarDias } from "@/lib/datas";
import { CartaoCheckin } from "@/componentes/CartaoCheckin";
import { GradeDias, type LinhaDaGrade } from "@/componentes/GradeDias";
import { InstalarApp } from "@/componentes/InstalarApp";
import { Vazio } from "@/componentes/Vazio";

const DIAS_NO_FEED = 7;

/**
 * Início: no topo verde-floresta, a semana da família em grade (uma linha
 * por pessoa, um quadrado por dia) e o check-in; embaixo, o feed da semana.
 */
export default async function PaginaInicio() {
  const { usuario, familia } = await exigirFamilia();
  const dia = hoje();
  const semana = diasEntre(inicioDaSemana(dia), somarDias(inicioDaSemana(dia), 6));

  // Os últimos 7 dias cobrem a semana inteira até hoje (a segunda está no máximo 6 dias atrás).
  const [checkins, membros] = await Promise.all([
    checkinsDaFamilia(familia.id, usuario.id, somarDias(dia, -(DIAS_NO_FEED - 1)), dia),
    prisma.membro.findMany({
      where: { familiaId: familia.id },
      select: { usuario: { select: selecaoPessoa } },
      orderBy: { entrouEm: "asc" },
    }),
  ]);

  const porDia = new Map<string, CheckinDoCartao[]>();
  const diasPorPessoa = new Map<string, Set<string>>();
  for (const c of checkins) {
    const d = deDate(c.dia);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d)!.push(c);
    if (d >= semana[0]) {
      if (!diasPorPessoa.has(c.usuarioId)) diasPorPessoa.set(c.usuarioId, new Set());
      diasPorPessoa.get(c.usuarioId)!.add(d);
    }
  }

  const treinaramHoje = new Set((porDia.get(dia) ?? []).map((c) => c.usuarioId));
  const postouHoje = treinaramHoje.has(usuario.id);
  const visitante = { id: usuario.id, postouHoje };
  const primeiroId = checkins[0]?.id;

  // Quem mais treinou na semana primeiro; empate, quem já treinou hoje.
  const linhas: LinhaDaGrade[] = membros
    .map(({ usuario: m }) => {
      const dias = diasPorPessoa.get(m.id) ?? new Set<string>();
      return { pessoa: m, dias, total: dias.size };
    })
    .sort((a, b) => b.total - a.total || Number(b.dias.has(dia)) - Number(a.dias.has(dia)));

  return (
    <div className="space-y-5">
      <section
        aria-label="Semana da família"
        className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] space-y-5 rounded-b-3xl bg-floresta px-5 pt-[calc(max(1rem,env(safe-area-inset-top))+1.25rem)] pb-5 text-white"
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-marca">{rotuloDataCurta(dia)}</p>
            <h1 className="mt-2 truncate text-[28px] leading-none font-light tracking-[-0.02em]">{familia.nome}</h1>
          </div>
          <div className="shrink-0 text-right">
            <p className="numero text-[44px] leading-[0.85]">
              {treinaramHoje.size}/{membros.length}
            </p>
            <p className="mt-1.5 text-[11px] font-medium tracking-[0.1em] text-sobre-floresta">HOJE</p>
          </div>
        </div>

        <div className="border-t border-floresta-linha pt-3.5">
          <GradeDias linhas={linhas} colunas={semana} hoje={dia} euId={usuario.id} rotulo="Treinos da semana por pessoa" />
        </div>

        {postouHoje ? (
          <p className="flex items-center gap-2 text-sm text-sobre-floresta">
            <CheckCircle2 className="size-5 shrink-0 text-marca" /> Seu check-in de hoje está feito.
          </p>
        ) : (
          <Link
            href="/checkin/novo"
            className="flex h-[52px] items-center justify-between rounded-xl bg-marca px-[18px] text-base font-medium text-marca-texto transition-transform active:scale-[0.98]"
          >
            Fazer meu check-in
            <ArrowRight className="size-5" strokeWidth={1.8} />
          </Link>
        )}
      </section>

      {!usuario.emailVerificado && (
        <Link
          href="/confirmar-email?depois=/"
          className="flex items-center gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 text-sm active:scale-[0.99]"
        >
          <MailWarning className="size-5 shrink-0 text-marca-forte" />
          <span className="min-w-0 flex-1">
            <span className="block font-normal">Confirme seu e-mail</span>
            <span className="text-suave">Sem isso, não dá para recuperar a senha.</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-suave" />
        </Link>
      )}

      <InstalarApp dispensavel />

      {[...porDia.entries()].map(([d, lista]) => (
        <section key={d} className="space-y-3">
          <h2 className="subtitulo flex justify-between px-1 pt-1">
            <span>{d === dia ? "Treinos de hoje" : rotuloDia(d)}</span>
            <span className="tabular-nums">{lista.length}</span>
          </h2>
          {lista.map((c) => (
            <CartaoCheckin
              key={c.id}
              checkin={c}
              borrado={deveBorrar(c, visitante, familia.borrarAtePostar)}
              prioridade={c.id === primeiroId}
            />
          ))}
        </section>
      ))}

      {checkins.length === 0 &&
        (membros.length === 1 ? (
          <Vazio icone={Users} titulo="Chame a família" texto="Envie o convite para começar a treinar junto.">
            <Link href="/familia" className="btn-primario w-full">
              Convidar
            </Link>
          </Vazio>
        ) : (
          <Vazio icone={Camera} titulo="Nada por aqui ainda" texto="Nenhum check-in na última semana. Que tal abrir os trabalhos hoje?" />
        ))}
    </div>
  );
}
