import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/componentes/Avatar";
import { BotaoCurtir } from "@/componentes/BotaoCurtir";
import { tempoRelativo } from "@/lib/datas";
import type { CheckinDoCartao } from "@/lib/consultas";

export function CartaoCheckin({
  checkin,
  borrado,
  completo = false,
}: {
  checkin: CheckinDoCartao;
  borrado: boolean;
  /** Na página do check-in: foto grande e sem link. */
  completo?: boolean;
}) {
  const foto = (
    <div className="relative overflow-hidden bg-borda" style={{ aspectRatio: `${checkin.largura} / ${checkin.altura}` }}>
      <Image
        // A miniatura é um recorte quadrado de 400px — serve ao painel, não ao card 3:4.
        src={`/api/fotos/${checkin.id}${borrado ? "?v=borrada" : ""}`}
        alt={checkin.descricao || `Check-in de ${checkin.usuario.nome}`}
        fill
        unoptimized
        sizes="(max-width: 32rem) 100vw, 32rem"
        className="object-cover"
      />
      {borrado && (
        <div className="absolute inset-0 grid place-items-center bg-black/30 p-6 text-center text-sm font-medium text-white">
          Faça seu check-in de hoje para ver
        </div>
      )}
    </div>
  );

  return (
    <article className="cartao overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Avatar usuario={checkin.usuario} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{checkin.usuario.nome}</p>
          <p className="text-xs text-suave">
            {tempoRelativo(checkin.criadoEm)}
            {checkin.atividade && ` · ${checkin.atividade}`}
            {checkin.duracaoMin && ` · ${checkin.duracaoMin} min`}
          </p>
        </div>
      </header>

      {completo || borrado ? foto : <Link href={`/checkin/${checkin.id}`}>{foto}</Link>}

      {checkin.descricao && !borrado && <p className="px-3 pt-3 text-sm whitespace-pre-line">{checkin.descricao}</p>}

      {!borrado && (
        <footer className="flex items-center gap-1 px-1 py-1">
          <BotaoCurtir
            checkinId={checkin.id}
            curtido={checkin.curtidas.length > 0}
            total={checkin._count.curtidas}
          />
          {!completo && (
            <Link href={`/checkin/${checkin.id}#comentarios`} className="flex min-h-11 items-center gap-1.5 px-2 text-sm">
              <span className="text-xl">💬</span>
              {checkin._count.comentarios > 0 && <span className="tabular-nums">{checkin._count.comentarios}</span>}
            </Link>
          )}
        </footer>
      )}
    </article>
  );
}
