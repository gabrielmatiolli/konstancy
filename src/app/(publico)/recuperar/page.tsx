import Link from "next/link";
import { KeyRound } from "lucide-react";
import { pedirRecuperacao } from "@/acoes/verificacao";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Recuperar senha" };

export default function PaginaRecuperar() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 grid size-14 place-items-center rounded-xl bg-marca-suave text-marca-forte">
          <KeyRound className="size-7" />
        </span>
        <h1 className="text-xl font-light">Esqueceu a senha?</h1>
        <p className="mt-1 text-[15px] text-suave">Mandamos um código para o e-mail da sua conta.</p>
      </div>
      <Formulario acao={pedirRecuperacao} textoBotao="Enviar código" textoEnviando="Enviando…">
        <div>
          <label className="rotulo" htmlFor="identificador">
            E-mail ou celular da conta
          </label>
          <input
            id="identificador"
            name="identificador"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            className="campo"
          />
        </div>
      </Formulario>
      <Link href="/entrar" className="block min-h-11 text-center text-[15px] font-medium text-suave">
        Voltar para o login
      </Link>
    </div>
  );
}
