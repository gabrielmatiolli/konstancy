"use client";

import { useState } from "react";
import { criarDesafio } from "@/acoes/desafios";
import { rotuloCurto, somarDias } from "@/lib/datas";
import { Formulario } from "@/componentes/Formulario";
import { Interruptor } from "@/componentes/Interruptor";

const DURACOES = [7, 14, 30];

/**
 * Criar desafio sem precisar mexer em calendário: escolhe a duração em um
 * toque (começa hoje). "Outras datas" abre os campos de data para quem quer.
 */
export function FormNovoDesafio({ hoje }: { hoje: string }) {
  const [duracao, setDuracao] = useState<number | "outra">(7);
  const fimSugerido = duracao === "outra" ? null : somarDias(hoje, duracao - 1);

  return (
    <Formulario acao={criarDesafio} textoBotao="Criar desafio" textoEnviando="Criando…" className="space-y-6">
      <div>
        <label className="rotulo" htmlFor="titulo">
          Nome do desafio
        </label>
        <input id="titulo" name="titulo" required maxLength={100} placeholder="Ex.: Semana sem desculpas" className="campo" />
      </div>

      <div>
        <label className="rotulo" htmlFor="premio">
          Prêmio para quem vencer
        </label>
        <input id="premio" name="premio" required maxLength={200} placeholder="Ex.: Quem perder paga a pizza" className="campo" />
      </div>

      <fieldset>
        <legend className="rotulo">Quanto tempo dura?</legend>
        <div className="grid grid-cols-4 gap-2">
          {DURACOES.map((d) => (
            <label key={d} className="chip justify-center px-2">
              <input type="radio" name="_duracao" className="sr-only" checked={duracao === d} onChange={() => setDuracao(d)} />
              {d} dias
            </label>
          ))}
          <label className="chip justify-center px-2">
            <input type="radio" name="_duracao" className="sr-only" checked={duracao === "outra"} onChange={() => setDuracao("outra")} />
            Outra
          </label>
        </div>
        {fimSugerido ? (
          <>
            <input type="hidden" name="dataInicio" value={hoje} />
            <input type="hidden" name="dataFim" value={fimSugerido} />
            <p className="mt-2 text-sm text-suave">
              De hoje até <strong className="text-texto">{rotuloCurto(fimSugerido)}</strong>.
            </p>
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="rotulo" htmlFor="dataInicio">
                Começa
              </label>
              <input id="dataInicio" name="dataInicio" type="date" required defaultValue={hoje} className="campo" />
            </div>
            <div>
              <label className="rotulo" htmlFor="dataFim">
                Termina
              </label>
              <input id="dataFim" name="dataFim" type="date" required min={hoje} defaultValue={somarDias(hoje, 29)} className="campo" />
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <label className="rotulo" htmlFor="descricao">
          Regras extras <span className="font-normal text-suave">(opcional)</span>
        </label>
        <textarea id="descricao" name="descricao" rows={2} maxLength={1000} className="campo resize-none" />
      </div>

      <div className="cartao px-4 py-2">
        <Interruptor name="todos" defaultChecked titulo="Toda a família participa" descricao="Senão, cada um entra pelo botão Participar." />
      </div>

      <p className="text-sm text-suave">
        Vence quem fizer check-in em mais dias diferentes no período. Mais de um check-in no mesmo dia conta uma vez.
      </p>
    </Formulario>
  );
}
