import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarFamilia, entrarNaFamilia } from "@/acoes/familia";
import { sair } from "@/acoes/auth";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Começar" };

/** Onboarding de quem ainda não está em nenhuma família. */
export default async function PaginaComecar() {
  const usuario = await exigirUsuario();
  if (await prisma.membro.count({ where: { usuarioId: usuario.id } })) redirect("/");

  return (
    <main className="mx-auto w-full max-w-sm space-y-8 px-4 py-10">
      <div>
        <h1 className="titulo-pagina">Oi, {usuario.nome.split(" ")[0]}!</h1>
        <p className="mt-1 text-suave">Entre na família com o código de convite ou crie uma nova.</p>
      </div>

      <section className="cartao p-4">
        <h2 className="mb-3 font-semibold">Tenho um convite</h2>
        <Formulario acao={entrarNaFamilia} textoBotao="Entrar na família">
          <input
            name="codigo"
            placeholder="Código (ex.: K7M2QX)"
            autoCapitalize="characters"
            autoComplete="off"
            required
            className="campo uppercase tracking-widest"
          />
        </Formulario>
      </section>

      <section className="cartao p-4">
        <h2 className="mb-3 font-semibold">Criar uma família</h2>
        <Formulario acao={criarFamilia} textoBotao="Criar família">
          <input name="nome" placeholder="Nome da família" required maxLength={80} className="campo" />
        </Formulario>
      </section>

      <form action={sair}>
        <button className="w-full text-sm text-suave">Sair da conta</button>
      </form>
    </main>
  );
}
