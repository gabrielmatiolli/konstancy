"use client";

import { useActionState, useEffect, useRef } from "react";
import { comentar } from "@/acoes/checkins";
import { estadoInicial } from "@/acoes/estado";

export function FormComentario({ checkinId }: { checkinId: string }) {
  const [estado, enviar, pendente] = useActionState(comentar, estadoInicial);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) form.current?.reset();
  }, [estado]);

  return (
    <form ref={form} action={enviar} className="space-y-2">
      <input type="hidden" name="checkinId" value={checkinId} />
      <div className="flex gap-2">
        <input name="texto" required maxLength={500} placeholder="Comentar…" className="campo" autoComplete="off" />
        <button type="submit" className="btn-primario shrink-0" disabled={pendente}>
          Enviar
        </button>
      </div>
      {estado.erro && <p className="erro">{estado.erro}</p>}
    </form>
  );
}
