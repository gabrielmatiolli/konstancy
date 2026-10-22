import Link from "next/link";
import { Camera, CheckCircle2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { checkinsDaFamilia, deveBorrar, type CheckinDoCartao } from "@/lib/consultas";
import { deDate, hoje, rotuloDia, somarDias } from "@/lib/datas";
import { Avatar } from "@/componentes/Avatar";
import { CartaoCheckin } from "@/componentes/CartaoCheckin";
import { InstalarApp } from "@/componentes/InstalarApp";
import { Topo } from "@/componentes/Topo";
import { Vazio } from "@/componentes/Vazio";

const DIAS_NO_FEED = 7;

/** Feed: quem já treinou hoje, o convite ao check-in e a última semana da família. */
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
  // Quem treinou primeiro; quem falta, por último.
  const ordenados = [...membros].sort(
    (a, b) => Number(treinaramHoje.has(b.usuario.id)) - Number(treinaramHoje.has(a.usuario.id)),
  );
  const primeiroId = checkins[0]?.id;

  return (
    <div className="space-y-5">
      <Topo sobretitulo={familia.nome} titulo={rotuloDia(dia)} />

      <section aria-label="Quem já treinou hoje" className="cartao p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-bold">Treinaram hoje</p>
          <p className="text-sm font-semibold text-suave tabular-nums">
            <span className="text-marca-forte">{treinaramHoje.size}</span> de {membros.length}
          </p>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-superficie-2">
          <div
            className="h-full rounded-full bg-marca transition-[width] duration-500"
            style={{ width: `${(treinaramHoje.size / Math.max(1, membros.length)) * 100}%` }}
          />
        </div>
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-1 pb-1 [scrollbar-width:none]">
          {ordenados.map(({ usuario: m }) => (
            <li key={m.id} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
              <Avatar usuario={m} tamanho={48} marcado={treinaramHoje.has(m.id)} />
              <span
                className={`w-full truncate text-center text-xs font-semibold ${treinaramHoje.has(m.id) ? "" : "text-suave"}`}
              >
                {m.id === usuario.id ? "Você" : m.nome.split(" ")[0]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {postouHoje ? (
        <p className="flex items-center gap-2 rounded-2xl bg-marca-suave px-4 py-3 text-sm font-semibold text-marca-forte">
          <CheckCircle2 className="size-5 shrink-0" /> Seu check-in de hoje está feito. Mandou bem!
        </p>
      ) : (
        <Link
          href="/checkin/novo"
          className="flex items-center gap-4 rounded-3xl bg-marca-forte p-4 text-white transition-transform active:scale-[0.98] dark:text-marca-texto"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20">
            <Camera className="size-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold">Fazer meu check-in</span>
            <span className="block text-sm opacity-90">Uma foto do treino de hoje</span>
          </span>
        </Link>
      )}

      <InstalarApp dispensavel />

      {[...porDia.entries()].map(([d, lista]) => (
        <section key={d} className="space-y-3">
          <h2 className="subtitulo pt-2">{d === dia ? "Hoje" : rotuloDia(d)}</h2>
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
