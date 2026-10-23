import Image from "next/image";
import Link from "next/link";
import { Lock, MessageCircle } from "lucide-react";
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
          <span className="grid size-12 place-items-center rounded-xl bg-white/20">
            <Lock className="size-6" />
          </span>
          <p className="max-w-[16rem] font-normal">Faça o seu check-in de hoje para ver</p>
          <Link href="/checkin/novo" className="btn min-h-10 border-transparent bg-marca px-4 text-sm font-medium text-marca-texto">
            Fazer check-in
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <article className={`cartao overflow-hidden ${completo ? "" : "leve"}`}>
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar usuario={checkin.usuario} tamanho={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-normal">{checkin.usuario.nome}</p>
          {(checkin.atividade || checkin.duracaoMin) && (
            <p className="truncate text-xs font-medium tracking-[0.02em] text-marca-forte">
              {[checkin.atividade, checkin.duracaoMin && `${checkin.duracaoMin} min`].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span className="shrink-0 text-xs text-suave">{tempoRelativo(checkin.criadoEm)}</span>
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
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-normal active:bg-superficie-2"
                aria-label={`${checkin._count.comentarios} comentários`}
              >
                <MessageCircle className="size-[22px]" strokeWidth={1.6} />
                {checkin._count.comentarios > 0 && <span className="tabular-nums">{checkin._count.comentarios}</span>}
              </Link>
            )}
          </div>
          {checkin.descricao && <p className="px-2 pb-1 text-[15px] font-normal whitespace-pre-line text-suave">{checkin.descricao}</p>}
        </div>
      )}
    </article>
  );
}
