"use client";

import { useTransition } from "react";

/** Botão que pede confirmação antes de chamar uma Server Action sem argumentos. */
export function BotaoConfirmar({
  acao,
  pergunta,
  children,
  className = "btn-perigo",
}: {
  acao: () => Promise<unknown>;
  pergunta: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pendente}
      onClick={() => {
        if (confirm(pergunta)) iniciar(async () => void (await acao()));
      }}
    >
      {children}
    </button>
  );
}
