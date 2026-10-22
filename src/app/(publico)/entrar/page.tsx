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
          <label className="rotulo" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="campo" />
        </div>
        <div>
          <label className="rotulo" htmlFor="senha">
            Senha
          </label>
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
      <p className="mt-6 text-center text-sm text-suave">
        Primeira vez?{" "}
        <Link href="/cadastro" className="font-medium text-marca">
          Criar conta
        </Link>
      </p>
    </>
  );
}
