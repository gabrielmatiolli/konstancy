import { criarDesafio } from "@/acoes/desafios";
import { hoje, somarDias } from "@/lib/datas";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Novo desafio" };

export default function PaginaNovoDesafio() {
  const dia = hoje();
  return (
    <div className="space-y-5">
      <h1 className="titulo-pagina">Novo desafio</h1>
      <Formulario acao={criarDesafio} textoBotao="Criar desafio" textoEnviando="Criando…">
        <div>
          <label className="rotulo" htmlFor="titulo">
            Título
          </label>
          <input id="titulo" name="titulo" required maxLength={100} placeholder="Ex.: 30 dias ativos" className="campo" />
        </div>
        <div>
          <label className="rotulo" htmlFor="premio">
            Prêmio
          </label>
          <input
            id="premio"
            name="premio"
            required
            maxLength={200}
            placeholder="Ex.: Quem perder paga a pizza"
            className="campo"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rotulo" htmlFor="dataInicio">
              Início
            </label>
            <input id="dataInicio" name="dataInicio" type="date" required defaultValue={dia} className="campo" />
          </div>
          <div>
            <label className="rotulo" htmlFor="dataFim">
              Fim
            </label>
            <input
              id="dataFim"
              name="dataFim"
              type="date"
              required
              min={dia}
              defaultValue={somarDias(dia, 29)}
              className="campo"
            />
          </div>
        </div>
        <div>
          <label className="rotulo" htmlFor="descricao">
            Regras / descrição <span className="font-normal text-suave">— opcional</span>
          </label>
          <textarea id="descricao" name="descricao" rows={3} maxLength={1000} className="campo resize-none" />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="todos" defaultChecked className="size-5 accent-(--marca)" />
          Inscrever a família toda
        </label>
        <p className="text-xs text-suave">
          Vence quem fizer check-in em mais dias diferentes dentro do período. Vários check-ins no mesmo dia contam uma
          vez.
        </p>
      </Formulario>
    </div>
  );
}
