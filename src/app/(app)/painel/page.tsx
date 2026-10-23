import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { selecaoPessoa } from "@/lib/pessoa";
import { exigirFamilia } from "@/lib/familia";
import { deDate, diasEntre, hoje, paraDate, rotuloCurto, rotuloSemana, somarDias } from "@/lib/datas";
import { deveBorrar, jaFezCheckinHoje } from "@/lib/consultas";
import { Avatar } from "@/componentes/Avatar";
import { Topo } from "@/componentes/Topo";

export const metadata = { title: "Painel" };

const PERIODOS = [7, 14, 30] as const;

/**
 * Visão geral: uma linha por pessoa, uma coluna por dia (hoje primeiro). No
 * celular a grade rola de lado com a coluna dos nomes fixa. Células usam a
 * miniatura de 240px — 30 dias × a família inteira ainda é leve no 4G.
 */
export default async function PaginaPainel({ searchParams }: PageProps<"/painel">) {
  const { usuario, familia } = await exigirFamilia();
  const { dias: bruto } = await searchParams;
  const periodo = PERIODOS.find((p) => String(p) === bruto) ?? 7;

  const fim = hoje();
  const inicio = somarDias(fim, -(periodo - 1));
  const colunas = diasEntre(inicio, fim).reverse();

  const [membros, checkins, postouHoje] = await Promise.all([
    prisma.membro.findMany({
      where: { familiaId: familia.id },
      select: { usuario: { select: selecaoPessoa } },
      orderBy: { entrouEm: "asc" },
    }),
    prisma.checkin.findMany({
      where: { familiaId: familia.id, dia: { gte: paraDate(inicio), lte: paraDate(fim) } },
      select: { id: true, usuarioId: true, dia: true },
      orderBy: { criadoEm: "asc" },
    }),
    jaFezCheckinHoje(familia.id, usuario.id),
  ]);

  // usuarioId → dia → check-ins do dia (o primeiro vira a miniatura da célula).
  const grade = new Map<string, Map<string, typeof checkins>>();
  for (const c of checkins) {
    const linha = grade.get(c.usuarioId) ?? new Map();
    const d = deDate(c.dia);
    linha.set(d, [...(linha.get(d) ?? []), c]);
    grade.set(c.usuarioId, linha);
  }

  const linhas = membros
    .map(({ usuario: m }) => ({ ...m, dias: grade.get(m.id) ?? new Map<string, typeof checkins>() }))
    .sort((a, b) => b.dias.size - a.dias.size);
  const diasAtivosTotal = linhas.reduce((n, l) => n + l.dias.size, 0);

  return (
    <div>
      <Topo titulo="Painel" sobretitulo={familia.nome} />

      <nav aria-label="Período" className="mb-4 grid grid-cols-3 rounded-xl bg-superficie-2 p-1">
        {PERIODOS.map((p) => (
          <Link
            key={p}
            href={`/painel?dias=${p}`}
            replace
            scroll={false}
            aria-current={p === periodo ? "page" : undefined}
            className={`grid min-h-10 place-items-center rounded-xl text-sm font-normal transition-colors ${
              p === periodo ? "bg-superficie text-texto shadow-sm" : "text-suave"
            }`}
          >
            {p} dias
          </Link>
        ))}
      </nav>

      <p className="mb-4 text-[15px] text-suave">
        Nestes {periodo} dias, a família somou{" "}
        <strong className="text-texto">
          {diasAtivosTotal} dia{diasAtivosTotal === 1 ? "" : "s"} de treino
        </strong>
        . Toque numa foto para abrir.
      </p>

      <div className="cartao -mx-4 overflow-x-auto rounded-none border-x-0 sm:mx-0 sm:rounded-2xl sm:border-x">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-superficie p-3 text-left">
                <span className="sr-only">Pessoa</span>
              </th>
              {colunas.map((d) => (
                <th
                  key={d}
                  className={`min-w-12 px-0.5 pt-3 pb-1 text-center text-[11px] leading-tight font-medium ${
                    d === fim ? "text-marca-forte" : "text-suave"
                  }`}
                >
                  <span className="block uppercase">{d === fim ? "Hoje" : rotuloSemana(d)}</span>
                  <span className="block font-normal tabular-nums">{rotuloCurto(d)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((m) => (
              <tr key={m.id}>
                <th scope="row" className="sticky left-0 z-10 bg-superficie py-1.5 pr-2 pl-3 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <Avatar usuario={m} tamanho={30} />
                    <span className="w-16 truncate font-medium">{m.id === usuario.id ? "Você" : m.nome.split(" ")[0]}</span>
                    <span className="min-w-6 rounded-md bg-marca-suave px-1.5 py-0.5 text-center text-xs font-normal tabular-nums text-marca-forte">
                      {m.dias.size}
                    </span>
                  </span>
                </th>
                {colunas.map((d) => {
                  const doDia = m.dias.get(d);
                  const primeiro = doDia?.[0];
                  const borrado =
                    primeiro && deveBorrar(primeiro, { id: usuario.id, postouHoje }, familia.borrarAtePostar);
                  return (
                    <td key={d} className="p-0.5">
                      {primeiro ? (
                        <Link
                          href={`/checkin/${primeiro.id}`}
                          className="relative block size-11 overflow-hidden rounded-xl bg-superficie-2"
                          aria-label={`${m.nome}, ${rotuloCurto(d)}`}
                        >
                          <Image
                            src={`/api/fotos/${primeiro.id}?v=${borrado ? "borrada" : "thumb"}`}
                            alt=""
                            fill
                            unoptimized
                            sizes="44px"
                            className="object-cover"
                          />
                          {borrado && (
                            <span className="absolute inset-0 grid place-items-center bg-marca/70 text-white">
                              <Check className="size-5" strokeWidth={3} />
                            </span>
                          )}
                          {doDia.length > 1 && (
                            <span className="absolute right-0.5 bottom-0.5 rounded-md bg-black/65 px-1 text-[10px] font-normal text-white">
                              {doDia.length}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="block size-11 rounded-xl bg-superficie-2" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky left-0 z-10 bg-superficie px-3 pt-2 pb-3 text-left text-xs font-medium text-suave">
                Treinaram
              </th>
              {colunas.map((d) => {
                const n = linhas.filter((m) => m.dias.has(d)).length;
                return (
                  <td key={d} className="px-0.5 pt-2 pb-3 text-center text-xs font-medium tabular-nums text-suave">
                    {n}/{linhas.length}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
