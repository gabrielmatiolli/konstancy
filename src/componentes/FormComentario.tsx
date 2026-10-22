"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
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
      <div className="flex items-center gap-2 rounded-full border border-borda bg-superficie py-1 pr-1 pl-4 focus-within:border-marca">
        <input
          name="texto"
          required
          maxLength={500}
          placeholder="Escreva um comentário…"
          aria-label="Comentário"
          autoComplete="off"
          enterKeyHint="send"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-suave"
        />
        <button
          type="submit"
          aria-label="Enviar comentário"
          disabled={pendente}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-marca-forte text-white transition-transform active:scale-90 disabled:opacity-60 dark:text-marca-texto"
        >
          {pendente ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </div>
      {estado.erro && <p className="erro">{estado.erro}</p>}
    </form>
  );
}
