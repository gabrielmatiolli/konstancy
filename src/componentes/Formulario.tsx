"use client";

import { useActionState, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { estadoInicial, type EstadoDoForm } from "@/acoes/estado";

/**
 * Form ligado a uma Server Action com useActionState: mostra o erro devolvido
 * e desabilita o botão enquanto envia. `filhos` recebe `pendente` para quem
 * precisar trocar o texto do botão.
 */
export function Formulario({
  acao,
  children,
  textoBotao,
  textoEnviando = "Enviando…",
  mensagemOk,
  className = "space-y-4",
}: {
  acao: (estado: EstadoDoForm, form: FormData) => Promise<EstadoDoForm>;
  children: ReactNode;
  textoBotao: string;
  textoEnviando?: string;
  mensagemOk?: string;
  className?: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, estadoInicial);
  return (
    <form action={enviar} className={className}>
      {children}
      {estado.erro && (
        <p className="erro" role="alert">
          {estado.erro}
        </p>
      )}
      {estado.ok && mensagemOk && !pendente && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-marca-forte" role="status">
          <Check className="size-4" /> {mensagemOk}
        </p>
      )}
      <button type="submit" className="btn-primario w-full" disabled={pendente}>
        {pendente ? (
          <>
            <Loader2 className="size-5 animate-spin" /> {textoEnviando}
          </>
        ) : (
          textoBotao
        )}
      </button>
    </form>
  );
}
