import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import {
  atualizarFamilia,
  entrarNaFamilia,
  gerarNovoConvite,
  removerMembro,
  sairDaFamilia,
  tornarAdmin,
  trocarFamiliaAtiva,
} from "@/acoes/familia";
import { Avatar } from "@/componentes/Avatar";
import { BotaoConfirmar } from "@/componentes/BotaoConfirmar";
import { CompartilharConvite } from "@/componentes/CompartilharConvite";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Família" };

export default async function PaginaFamilia() {
  const { usuario, familia, papel } = await exigirFamilia();
  const admin = papel === "ADMIN";

  const [membros, minhasFamilias] = await Promise.all([
    prisma.membro.findMany({
      where: { familiaId: familia.id },
      include: { usuario: { select: { id: true, nome: true } } },
      orderBy: { entrouEm: "asc" },
    }),
    prisma.membro.findMany({
      where: { usuarioId: usuario.id },
      include: { familia: { select: { id: true, nome: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/perfil" className="text-sm text-suave">
        ← Perfil
      </Link>
      <h1 className="titulo-pagina">{familia.nome}</h1>

      <section className="cartao space-y-3 p-4">
        <h2 className="font-semibold">Convite</h2>
        <CompartilharConvite codigo={familia.codigoConvite} familia={familia.nome} />
        {admin && (
          <BotaoConfirmar
            acao={gerarNovoConvite}
            pergunta="Gerar um código novo? O link antigo para de funcionar."
            className="w-full text-sm text-suave underline"
          >
            Gerar novo código
          </BotaoConfirmar>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Membros ({membros.length})</h2>
        <ul className="cartao divide-y divide-borda">
          {membros.map((m) => (
            <li key={m.usuarioId} className="flex items-center gap-3 p-3">
              <Avatar usuario={m.usuario} tamanho={32} />
              <span className="min-w-0 flex-1 truncate">
                {m.usuario.nome}
                {m.papel === "ADMIN" && <span className="ml-2 text-xs text-suave">admin</span>}
              </span>
              {admin && m.usuarioId !== usuario.id && (
                <span className="flex gap-2 text-xs">
                  {m.papel !== "ADMIN" && (
                    <BotaoConfirmar
                      acao={tornarAdmin.bind(null, m.usuarioId)}
                      pergunta={`Tornar ${m.usuario.nome} administrador?`}
                      className="text-suave underline"
                    >
                      admin
                    </BotaoConfirmar>
                  )}
                  <BotaoConfirmar
                    acao={removerMembro.bind(null, m.usuarioId)}
                    pergunta={`Remover ${m.usuario.nome} da família?`}
                    className="text-perigo underline"
                  >
                    remover
                  </BotaoConfirmar>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {admin && (
        <section className="cartao p-4">
          <h2 className="mb-3 font-semibold">Configurações</h2>
          <Formulario acao={atualizarFamilia} textoBotao="Salvar" mensagemOk="Salvo.">
            <div>
              <label className="rotulo" htmlFor="nome">
                Nome da família
              </label>
              <input id="nome" name="nome" defaultValue={familia.nome} required maxLength={80} className="campo" />
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="borrarAtePostar"
                defaultChecked={familia.borrarAtePostar}
                className="mt-0.5 size-5 accent-(--marca)"
              />
              <span>
                Modo BeReal
                <span className="block text-xs text-suave">
                  As fotos do dia ficam borradas até a pessoa postar o check-in dela.
                </span>
              </span>
            </label>
          </Formulario>
        </section>
      )}

      {minhasFamilias.length > 1 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Minhas famílias</h2>
          <ul className="cartao divide-y divide-borda">
            {minhasFamilias.map(({ familia: f }) => (
              <li key={f.id} className="flex items-center justify-between p-3">
                <span>{f.nome}</span>
                {f.id === familia.id ? (
                  <span className="text-xs text-marca">ativa</span>
                ) : (
                  <form action={trocarFamiliaAtiva.bind(null, f.id)}>
                    <button className="text-sm text-marca">Abrir</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="cartao p-4">
        <summary className="cursor-pointer font-semibold">Entrar em outra família</summary>
        <div className="pt-3">
          <Formulario acao={entrarNaFamilia} textoBotao="Entrar">
            <input name="codigo" placeholder="Código de convite" required className="campo uppercase tracking-widest" />
          </Formulario>
        </div>
      </details>

      <BotaoConfirmar acao={sairDaFamilia} pergunta={`Sair de ${familia.nome}?`} className="btn-perigo w-full">
        Sair da família
      </BotaoConfirmar>
    </div>
  );
}
