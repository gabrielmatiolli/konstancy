import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { deDate, diasEntre, hoje, paraDate, rotuloCurto, rotuloSemana, somarDias } from "@/lib/datas";
import { deveBorrar, jaFezCheckinHoje } from "@/lib/consultas";
import { Avatar } from "@/componentes/Avatar";

export const metadata = { title: "Painel" };

const PERIODOS = [7, 14, 30] as const;

/**
 * Visão geral: uma linha por pessoa, uma coluna por dia. No celular a grade
 * rola de lado com a coluna dos nomes fixa; o dia de hoje vem primeiro.
 */
export default async function PaginaPainel({ searchParams }: PageProps<"/painel">) {
  const { usuario, familia } = await exigirFamilia();
  const { dias: bruto } = await searchParams;
  const periodo = PERIODOS.find((p) => String(p) === bruto) ?? 14;

  const fim = hoje();
  const inicio = somarDias(fim, -(periodo - 1));
  const colunas = diasEntre(inicio, fim).reverse();

  const [membros, checkins, postouHoje] = await Promise.all([
    prisma.membro.findMany({
      where: { familiaId: familia.id },
      select: { usuario: { select: { id: true, nome: true } } },
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

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <h1 className="titulo-pagina">Painel</h1>
        <nav className="flex gap-1 text-sm" aria-label="Período">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/painel?dias=${p}`}
              className={`rounded-full px-3 py-1.5 ${p === periodo ? "bg-marca text-marca-texto" : "text-suave"}`}
            >
              {p}d
            </Link>
          ))}
        </nav>
      </header>

      <div className="cartao -mx-4 overflow-x-auto rounded-none border-x-0 sm:mx-0 sm:rounded-2xl sm:border-x">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-superficie p-2 text-left font-medium">
                <span className="sr-only">Pessoa</span>
              </th>
              {colunas.map((d) => (
                <th key={d} className="min-w-12 p-1 text-center text-[11px] font-normal text-suave">
                  <span className="block">{d === fim ? "hoje" : rotuloSemana(d)}</span>
                  <span className="block">{rotuloCurto(d)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((m) => (
              <tr key={m.id}>
                <th scope="row" className="sticky left-0 z-10 border-t border-borda bg-superficie p-2 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <Avatar usuario={m} tamanho={28} />
                    <span className="max-w-20 truncate">{m.id === usuario.id ? "Você" : m.nome.split(" ")[0]}</span>
                    <span className="ml-auto pl-1 text-xs font-semibold tabular-nums text-marca">{m.dias.size}</span>
                  </span>
                </th>
                {colunas.map((d) => {
                  const doDia = m.dias.get(d);
                  const primeiro = doDia?.[0];
                  const borrado =
                    primeiro && deveBorrar(primeiro, { id: usuario.id, postouHoje }, familia.borrarAtePostar);
                  return (
                    <td key={d} className="border-t border-borda p-1">
                      {primeiro ? (
                        <Link
                          href={`/checkin/${primeiro.id}`}
                          className="relative block size-11 overflow-hidden rounded-lg bg-borda"
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
                          {borrado && <span className="absolute inset-0 grid place-items-center text-white">✓</span>}
                          {doDia.length > 1 && (
                            <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
                              {doDia.length}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="block size-11 rounded-lg border border-dashed border-borda" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky left-0 z-10 border-t border-borda bg-superficie p-2 text-left text-xs font-normal text-suave">
                Treinaram
              </th>
              {colunas.map((d) => {
                const n = linhas.filter((m) => m.dias.has(d)).length;
                return (
                  <td key={d} className="border-t border-borda p-1 text-center text-xs tabular-nums text-suave">
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
