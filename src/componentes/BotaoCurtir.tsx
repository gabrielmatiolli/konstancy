"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { alternarCurtida } from "@/acoes/checkins";

/** Curtida otimista: o coração muda no toque, sem esperar a rede (lenta no 4G fraco). */
export function BotaoCurtir({ checkinId, curtido, total }: { checkinId: string; curtido: boolean; total: number }) {
  const [estado, aplicar] = useOptimistic({ curtido, total }, (atual) => ({
    curtido: !atual.curtido,
    total: atual.total + (atual.curtido ? -1 : 1),
  }));
  const [, iniciar] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={estado.curtido}
      aria-label={estado.curtido ? "Descurtir" : "Curtir"}
      onClick={() =>
        iniciar(async () => {
          aplicar(null);
          await alternarCurtida(checkinId);
        })
      }
      className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-normal active:bg-superficie-2"
    >
      <Heart
        className={`size-[22px] transition-transform duration-200 ${estado.curtido ? "scale-110 fill-curtida text-curtida" : ""}`}
        strokeWidth={1.6}
      />
      {estado.total > 0 && <span className="tabular-nums">{estado.total}</span>}
    </button>
  );
}
