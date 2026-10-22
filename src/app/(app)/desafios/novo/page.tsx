import { hoje } from "@/lib/datas";
import { FormNovoDesafio } from "@/componentes/FormNovoDesafio";
import { Topo } from "@/componentes/Topo";

export const metadata = { title: "Novo desafio" };

export default function PaginaNovoDesafio() {
  return (
    <div>
      <Topo voltar="/desafios" titulo="Novo desafio" />
      <FormNovoDesafio hoje={hoje()} />
    </div>
  );
}
