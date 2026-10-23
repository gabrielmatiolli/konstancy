import Link from "next/link";
import { redirect } from "next/navigation";
import { cadastrar } from "@/acoes/auth";
import { usuarioLogado } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizarCodigo } from "@/lib/familia";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Criar conta" };

export default async function PaginaCadastro({ searchParams }: PageProps<"/cadastro">) {
  if (await usuarioLogado()) redirect("/");
  const { codigo: bruto } = await searchParams;
  const codigo = typeof bruto === "string" ? normalizarCodigo(bruto) : "";
  const familia = codigo
    ? await prisma.familia.findUnique({ where: { codigoConvite: codigo }, select: { nome: true } })
    : null;

  return (
    <>
      {familia && (
        <p className="mb-6 rounded-xl bg-marca-suave p-4 text-center text-[15px] text-marca-forte">
          Você foi convidado para <strong>{familia.nome}</strong>. Crie sua conta para entrar.
        </p>
      )}
      <Formulario acao={cadastrar} textoBotao="Criar conta" textoEnviando="Criando…">
        <input type="hidden" name="codigo" value={familia ? codigo : ""} />
        <div>
          <label className="rotulo" htmlFor="nome">
            Seu nome
          </label>
          <input id="nome" name="nome" autoComplete="given-name" required maxLength={80} className="campo" />
        </div>
        <div>
          <label className="rotulo" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="campo" />
          <p className="mt-1 text-xs text-suave">Vamos mandar um código para confirmar. É por ele que você recupera a senha.</p>
        </div>
        <div>
          <label className="rotulo" htmlFor="telefone">
            Celular <span className="font-normal text-suave">(opcional, para entrar com ele)</span>
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 98765-4321"
            className="campo"
          />
        </div>
        <div>
          <label className="rotulo" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            className="campo"
          />
        </div>
      </Formulario>
      <p className="mt-6 text-center text-[15px] text-suave">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-normal text-marca-forte">
          Entrar
        </Link>
      </p>
    </>
  );
}
