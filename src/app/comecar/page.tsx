import { redirect } from "next/navigation";
import { Ticket, UsersRound } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarFamilia, entrarNaFamilia } from "@/acoes/familia";
import { sair } from "@/acoes/auth";
import { Formulario } from "@/componentes/Formulario";
import { Marca } from "@/componentes/Marca";

export const metadata = { title: "Começar" };

/** Onboarding de quem ainda não está em nenhuma família. */
export default async function PaginaComecar() {
  const usuario = await exigirUsuario();
  if (await prisma.membro.count({ where: { usuarioId: usuario.id } })) redirect("/");

  return (
    <main className="mx-auto w-full max-w-sm space-y-5 px-5 py-10">
      <div className="mb-2 flex flex-col items-center text-center">
        <Marca tamanho={56} />
        <h1 className="mt-4 text-[26px] font-light">Oi, {usuario.nome.split(" ")[0]}!</h1>
        <p className="text-suave">Para começar, entre na família de vocês.</p>
      </div>

      <section className="cartao p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-marca-suave text-marca-forte">
            <Ticket className="size-5" />
          </span>
          <div>
            <h2 className="font-normal">Recebi um convite</h2>
            <p className="text-sm text-suave">Digite o código que te mandaram.</p>
          </div>
        </div>
        <Formulario acao={entrarNaFamilia} textoBotao="Entrar na família">
          <input
            name="codigo"
            placeholder="K7M2QX"
            aria-label="Código de convite"
            autoCapitalize="characters"
            autoComplete="off"
            required
            className="campo text-center text-xl font-normal tracking-[0.3em] uppercase"
          />
        </Formulario>
      </section>

      <div className="flex items-center gap-3 text-sm text-suave">
        <span className="h-px flex-1 bg-borda" /> ou <span className="h-px flex-1 bg-borda" />
      </div>

      <section className="cartao p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-superficie-2 text-suave">
            <UsersRound className="size-5" />
          </span>
          <div>
            <h2 className="font-normal">Sou o primeiro</h2>
            <p className="text-sm text-suave">Crie a família e convide o pessoal.</p>
          </div>
        </div>
        <Formulario acao={criarFamilia} textoBotao="Criar família">
          <input name="nome" placeholder="Ex.: Família Silva" aria-label="Nome da família" required maxLength={80} className="campo" />
        </Formulario>
      </section>

      <form action={sair} className="text-center">
        <button className="min-h-11 px-4 text-sm font-medium text-suave">Sair da conta</button>
      </form>
    </main>
  );
}
