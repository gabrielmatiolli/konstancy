"use client";

import { useActionState, useEffect, useState } from "react";
import { estadoInicial, type EstadoDoForm } from "@/acoes/estado";

const ESPERA_S = 60;

/**
 * "Reenviar código" com contagem regressiva — o servidor também recusa antes
 * de 60 s; aqui só evita o toque inútil. `esperaInicial`: segundos que faltam
 * desde o último envio (calculados no servidor).
 */
export function BotaoReenviar({
  acao,
  esperaInicial = 0,
  texto = "Reenviar código",
  destaque = false,
}: {
  acao: () => Promise<EstadoDoForm>;
  esperaInicial?: number;
  texto?: string;
  /** Botão principal (primeiro envio) em vez de link discreto (reenvio). */
  destaque?: boolean;
}) {
  const [restam, setRestam] = useState(esperaInicial);
  const [estado, enviar, pendente] = useActionState(async () => {
    const resultado = await acao();
    if (resultado.ok) setRestam(ESPERA_S);
    return resultado;
  }, estadoInicial);

  useEffect(() => {
    if (restam <= 0) return;
    const t = setTimeout(() => setRestam((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restam]);

  return (
    <form action={enviar} className="space-y-2 text-center">
      <button
        type="submit"
        disabled={pendente || restam > 0}
        className={
          destaque
            ? "btn-primario w-full"
            : "min-h-11 px-4 text-[15px] font-semibold text-marca-forte disabled:text-suave"
        }
      >
        {pendente ? "Enviando…" : restam > 0 ? `${texto} em ${restam} s` : texto}
      </button>
      {estado.ok && <p className="text-sm font-semibold text-marca-forte">Código enviado!</p>}
      {estado.erro && <p className="erro">{estado.erro}</p>}
    </form>
  );
}
