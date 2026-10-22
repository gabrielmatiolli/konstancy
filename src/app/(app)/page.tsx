import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { checkinsDaFamilia, deveBorrar, type CheckinDoCartao } from "@/lib/consultas";
import { deDate, hoje, rotuloDia, somarDias } from "@/lib/datas";
import { Avatar } from "@/componentes/Avatar";
import { CartaoCheckin } from "@/componentes/CartaoCheckin";

const DIAS_NO_FEED = 7;

/** Feed: quem já treinou hoje, o CTA do check-in e a última semana da família. */
export default async function PaginaInicio() {
  const { usuario, familia } = await exigirFamilia();
  const dia = hoje();

  const [checkins, membros] = await Promise.all([
    checkinsDaFamilia(familia.id, usuario.id, somarDias(dia, -(DIAS_NO_FEED - 1)), dia),
    prisma.membro.findMany({
      where: { familiaId: familia.id },
      select: { usuario: { select: { id: true, nome: true } } },
      orderBy: { entrouEm: "asc" },
    }),
  ]);

  const porDia = new Map<string, CheckinDoCartao[]>();
  for (const c of checkins) {
    const d = deDate(c.dia);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d)!.push(c);
  }

  const deHoje = porDia.get(dia) ?? [];
  const treinaramHoje = new Set(deHoje.map((c) => c.usuarioId));
  const postouHoje = treinaramHoje.has(usuario.id);
  const visitante = { id: usuario.id, postouHoje };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-suave">{familia.nome}</p>
        <h1 className="titulo-pagina">{rotuloDia(dia)}</h1>
      </header>

      <section aria-label="Quem já treinou hoje" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-4">
          {membros.map(({ usuario: m }) => (
            <li key={m.id} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
              <Avatar usuario={m} tamanho={48} marcado={treinaramHoje.has(m.id)} />
              <span className={`w-full truncate text-center text-xs ${treinaramHoje.has(m.id) ? "" : "text-suave"}`}>
                {m.id === usuario.id ? "Você" : m.nome.split(" ")[0]}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-suave">
          {treinaramHoje.size} de {membros.length} treinaram hoje
        </p>
      </section>

      {!postouHoje && (
        <Link href="/checkin/novo" className="btn-primario w-full py-4 text-base">
          📸 Fazer meu check-in de hoje
        </Link>
      )}

      {[...porDia.entries()].map(([d, lista]) => (
        <section key={d} className="space-y-4">
          {d !== dia && <h2 className="pt-2 text-lg font-semibold">{rotuloDia(d)}</h2>}
          {lista.map((c) => (
            <CartaoCheckin key={c.id} checkin={c} borrado={deveBorrar(c, visitante, familia.borrarAtePostar)} />
          ))}
        </section>
      ))}

      {checkins.length === 0 && (
        <p className="py-10 text-center text-suave">Nenhum check-in na última semana. Que tal começar hoje?</p>
      )}
    </div>
  );
}
