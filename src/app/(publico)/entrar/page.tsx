import Link from "next/link";
import { redirect } from "next/navigation";
import { entrar } from "@/acoes/auth";
import { usuarioLogado } from "@/lib/auth";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  if (await usuarioLogado()) redirect("/");
  const { de } = await searchParams;

  return (
    <>
      <Formulario acao={entrar} textoBotao="Entrar" textoEnviando="Entrando…">
        <input type="hidden" name="de" value={typeof de === "string" ? de : ""} />
        <div>
          <label className="rotulo" htmlFor="identificador">
            E-mail ou celular
          </label>
          <input
            id="identificador"
            name="identificador"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="voce@email.com ou (11) 98765-4321"
            required
            className="campo"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="rotulo" htmlFor="senha">
              Senha
            </label>
            <Link href="/recuperar" className="text-sm font-semibold text-marca-forte">
              Esqueci a senha
            </Link>
          </div>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className="campo"
          />
        </div>
      </Formulario>
      <p className="mt-6 text-center text-[15px] text-suave">
        Primeira vez?{" "}
        <Link href="/cadastro" className="font-bold text-marca-forte">
          Criar conta
        </Link>
      </p>
    </>
  );
}
