"use client";

import { useOptimistic, useTransition } from "react";
import { alternarCurtida } from "@/acoes/checkins";

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
      className="flex min-h-11 items-center gap-1.5 px-2 text-sm"
    >
      <span className={`text-xl ${estado.curtido ? "" : "grayscale opacity-60"}`}>❤️</span>
      {estado.total > 0 && <span className="tabular-nums">{estado.total}</span>}
    </button>
  );
}
