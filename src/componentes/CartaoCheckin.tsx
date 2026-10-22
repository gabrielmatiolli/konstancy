import Image from "next/image";
import Link from "next/link";
import { Clock, Lock, MessageCircle } from "lucide-react";
import { Avatar } from "@/componentes/Avatar";
import { BotaoCurtir } from "@/componentes/BotaoCurtir";
import { tempoRelativo } from "@/lib/datas";
import type { CheckinDoCartao } from "@/lib/consultas";

/** Retrato muito alto ou panorâmica muito larga viram 4:5 / 16:10 — o card não domina a tela. */
function proporcao(largura: number, altura: number) {
  return Math.min(1.6, Math.max(0.8, largura / altura));
}

export function CartaoCheckin({
  checkin,
  borrado,
  completo = false,
  prioridade = false,
}: {
  checkin: CheckinDoCartao;
  borrado: boolean;
  /** Na página do check-in: foto grande e sem link. */
  completo?: boolean;
  /** Primeiro card do feed: carrega já, é o que aparece primeiro na tela. */
  prioridade?: boolean;
}) {
  const versao = borrado ? "?v=borrada" : completo ? "" : "?v=media";
  const foto = (
    <div
      className="relative overflow-hidden bg-superficie-2"
      style={{
        // Borrada não mostra nada: baixa, para não empurrar o resto do feed.
        aspectRatio: borrado
          ? 4 / 3
          : completo
            ? `${checkin.largura} / ${checkin.altura}`
            : proporcao(checkin.largura, checkin.altura),
      }}
    >
      <Image
        src={`/api/fotos/${checkin.id}${versao}`}
        alt={checkin.descricao || `Check-in de ${checkin.usuario.nome}`}
        fill
        unoptimized
        loading={prioridade ? "eager" : "lazy"}
        fetchPriority={prioridade ? "high" : "auto"}
        sizes="(max-width: 32rem) 100vw, 32rem"
        className="object-cover"
      />
      {borrado && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25 p-6 text-center text-white">
          <span className="grid size-12 place-items-center rounded-full bg-white/20">
            <Lock className="size-6" />
          </span>
          <p className="max-w-[16rem] font-semibold">Faça o seu check-in de hoje para ver</p>
          <Link href="/checkin/novo" className="btn min-h-10 border-transparent bg-white px-4 text-sm text-black">
            Fazer check-in
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <article className={`cartao overflow-hidden ${completo ? "" : "leve"}`}>
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar usuario={checkin.usuario} tamanho={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{checkin.usuario.nome}</p>
          <p className="flex items-center gap-1.5 truncate text-[13px] text-suave">
            {tempoRelativo(checkin.criadoEm)}
            {checkin.duracaoMin && (
              <>
                <span aria-hidden>·</span>
                <Clock className="size-3.5" /> {checkin.duracaoMin} min
              </>
            )}
          </p>
        </div>
        {checkin.atividade && (
          <span className="shrink-0 rounded-full bg-marca-suave px-3 py-1 text-xs font-bold text-marca-forte">
            {checkin.atividade}
          </span>
        )}
      </header>

      {completo || borrado ? foto : <Link href={`/checkin/${checkin.id}`}>{foto}</Link>}

      {!borrado && (
        <div className="px-2 pt-1 pb-2">
          <div className="flex items-center">
            <BotaoCurtir
              checkinId={checkin.id}
              curtido={checkin.curtidas.length > 0}
              total={checkin._count.curtidas}
            />
            {!completo && (
              <Link
                href={`/checkin/${checkin.id}#comentarios`}
                className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-semibold active:bg-superficie-2"
                aria-label={`${checkin._count.comentarios} comentários`}
              >
                <MessageCircle className="size-6" strokeWidth={1.9} />
                {checkin._count.comentarios > 0 && <span className="tabular-nums">{checkin._count.comentarios}</span>}
              </Link>
            )}
          </div>
          {checkin.descricao && <p className="px-2 pb-1 text-[15px] whitespace-pre-line">{checkin.descricao}</p>}
        </div>
      )}
    </article>
  );
}
