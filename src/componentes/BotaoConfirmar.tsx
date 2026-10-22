"use client";

import { useRef, useTransition } from "react";

/**
 * Botão que confirma numa folha que sobe de baixo antes de chamar a Server
 * Action. Substitui o confirm() nativo, que no Android aparece como
 * "localhost diz…" e muda de cara em cada navegador.
 */
export function BotaoConfirmar({
  acao,
  pergunta,
  detalhe,
  textoConfirmar = "Confirmar",
  perigo = true,
  children,
  className = "btn-perigo",
}: {
  acao: () => Promise<unknown>;
  pergunta: string;
  detalhe?: string;
  textoConfirmar?: string;
  perigo?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [pendente, iniciar] = useTransition();

  return (
    <>
      <button type="button" className={className} disabled={pendente} onClick={() => dialogo.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={dialogo}
        // Toque fora da folha fecha.
        onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
        className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-black/50 sm:m-auto sm:max-w-sm"
      >
        <div className="surgir rounded-t-3xl bg-superficie p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-texto sm:rounded-3xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borda sm:hidden" aria-hidden />
          <p className="text-lg font-bold">{pergunta}</p>
          {detalhe && <p className="mt-1 text-sm text-suave">{detalhe}</p>}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" className="btn-suave" onClick={() => dialogo.current?.close()}>
              Cancelar
            </button>
            <button
              type="button"
              className={perigo ? "btn border-transparent bg-perigo text-white" : "btn-primario"}
              disabled={pendente}
              onClick={() =>
                iniciar(async () => {
                  await acao();
                  dialogo.current?.close();
                })
              }
            >
              {pendente ? "Aguarde…" : textoConfirmar}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
