import { inicialDaSemana } from "@/lib/datas";
import type { Pessoa } from "@/lib/pessoa";

export interface LinhaDaGrade {
  pessoa: Pessoa;
  /** Dias ("AAAA-MM-DD") com pelo menos um check-in. */
  dias: Set<string>;
  total: number;
  /** Posição no placar ("1º"); sem ela, a coluna não aparece. */
  posicao?: string;
  lider?: boolean;
}

/**
 * A assinatura visual do Konstancy: uma linha por pessoa, um quadrado por
 * dia. Desenhada para o bloco verde-floresta (topo do início e do desafio).
 *
 *   treinou      verde Konstancy
 *   não treinou  floresta mais clara
 *   hoje         anel branco se já treinou; contorno verde se ainda não
 *   por vir      só o contorno
 */
export function GradeDias({
  linhas,
  colunas,
  hoje,
  euId,
  tamanho = 30,
  rotulo,
}: {
  linhas: LinhaDaGrade[];
  colunas: string[];
  hoje: string;
  euId: string;
  tamanho?: number;
  rotulo: string;
}) {
  const comPosicao = linhas.some((l) => l.posicao);
  // Nome com no mínimo 54px; os quadrados encolhem em tela estreita (360px) e
  // param em `tamanho` nas maiores.
  const colunasGrid = `${comPosicao ? "22px " : ""}minmax(54px, 1fr) repeat(${colunas.length}, minmax(0, ${tamanho}px)) 30px`;

  return (
    <div role="table" aria-label={rotulo} className="flex flex-col gap-1.5">
      <div role="row" className="grid items-center gap-[5px] text-[11px] font-medium text-sobre-floresta" style={{ gridTemplateColumns: colunasGrid }}>
        {comPosicao && <span role="columnheader" />}
        {/* Ocupa a coluna do nome; o texto fica só para leitores de tela. */}
        <span role="columnheader">
          <span className="sr-only">Pessoa</span>
        </span>
        {colunas.map((d) => (
          <span key={d} role="columnheader" className={`text-center ${d === hoje ? "text-marca" : ""}`}>
            {inicialDaSemana(d)}
          </span>
        ))}
        <span role="columnheader">
          <span className="sr-only">Dias</span>
        </span>
      </div>

      {linhas.map((l) => {
        const eu = l.pessoa.id === euId;
        return (
          <div
            key={l.pessoa.id}
            role="row"
            className={`grid items-center gap-[5px] ${eu && comPosicao ? "-mx-2 rounded-[10px] bg-floresta-2 px-2 py-1.5" : ""}`}
            style={{ gridTemplateColumns: colunasGrid }}
          >
            {comPosicao && (
              <span className={`text-xs font-semibold ${l.lider ? "text-marca" : "text-sobre-floresta"}`}>{l.posicao}</span>
            )}
            <span role="rowheader" className={`truncate text-sm ${l.dias.has(hoje) ? "font-normal text-white" : "text-sobre-floresta"}`}>
              {eu ? "Você" : l.pessoa.nome.split(" ")[0]}
            </span>
            {colunas.map((d) => (
              <span key={d} role="cell" aria-label={descrever(d, hoje, l.dias.has(d))} className="block aspect-square rounded-[7px]" style={estilo(d, hoje, l.dias.has(d))} />
            ))}
            <span className={`numero text-right text-2xl ${l.lider ? "text-marca" : "text-white"}`}>{l.total}</span>
          </div>
        );
      })}
    </div>
  );
}

function estilo(dia: string, hoje: string, treinou: boolean): React.CSSProperties {
  if (dia > hoje) return { boxShadow: "inset 0 0 0 1px var(--floresta-linha)" };
  if (dia === hoje) {
    return treinou
      ? { background: "var(--marca)", boxShadow: "0 0 0 2px var(--floresta), 0 0 0 3.5px #ffffff" }
      : { boxShadow: "inset 0 0 0 1.5px var(--marca)" };
  }
  return { background: treinou ? "var(--marca)" : "var(--floresta-2)" };
}

function descrever(dia: string, hoje: string, treinou: boolean) {
  if (dia > hoje) return "por vir";
  if (dia === hoje) return treinou ? "hoje: treinou" : "hoje: ainda não";
  return treinou ? "treinou" : "não treinou";
}
