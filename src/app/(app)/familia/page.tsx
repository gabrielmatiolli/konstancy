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
import { Interruptor } from "@/componentes/Interruptor";
import { Topo } from "@/componentes/Topo";

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
      <Topo voltar="/perfil" titulo={familia.nome} sobretitulo="Família" />

      <section className="cartao space-y-4 p-5 text-center">
        <div>
          <p className="font-bold">Convide quem falta</p>
          <p className="text-sm text-suave">Mande o link no WhatsApp ou passe o código.</p>
        </div>
        <CompartilharConvite codigo={familia.codigoConvite} familia={familia.nome} />
        {admin && (
          <BotaoConfirmar
            acao={gerarNovoConvite}
            pergunta="Gerar um código novo?"
            detalhe="O link e o código antigos param de funcionar."
            textoConfirmar="Gerar"
            perigo={false}
            className="min-h-10 text-sm font-semibold text-suave"
          >
            Gerar novo código
          </BotaoConfirmar>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="subtitulo">Membros · {membros.length}</h2>
        <ul className="cartao divide-y divide-borda overflow-hidden">
          {membros.map((m) => (
            <li key={m.usuarioId} className="flex min-h-16 items-center gap-3 px-4 py-2">
              <Avatar usuario={m.usuario} tamanho={40} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {m.usuario.nome}
                  {m.usuarioId === usuario.id && <span className="text-suave"> (você)</span>}
                </span>
                {m.papel === "ADMIN" && <span className="text-xs font-semibold text-marca-forte">Administrador</span>}
              </span>
              {admin && m.usuarioId !== usuario.id && (
                <span className="flex gap-1">
                  {m.papel !== "ADMIN" && (
                    <BotaoConfirmar
                      acao={tornarAdmin.bind(null, m.usuarioId)}
                      pergunta={`Tornar ${m.usuario.nome} administrador?`}
                      detalhe="Administradores mudam o nome, o convite e os membros."
                      textoConfirmar="Tornar admin"
                      perigo={false}
                      className="min-h-10 rounded-full px-3 text-xs font-bold text-suave active:bg-superficie-2"
                    >
                      Admin
                    </BotaoConfirmar>
                  )}
                  <BotaoConfirmar
                    acao={removerMembro.bind(null, m.usuarioId)}
                    pergunta={`Remover ${m.usuario.nome}?`}
                    detalhe="Os check-ins dessa pessoa continuam salvos, mas ela deixa de ver a família."
                    textoConfirmar="Remover"
                    className="min-h-10 rounded-full px-3 text-xs font-bold text-perigo active:bg-perigo/10"
                  >
                    Remover
                  </BotaoConfirmar>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {admin && (
        <section className="space-y-2">
          <h2 className="subtitulo">Configurações</h2>
          <div className="cartao p-4">
            <Formulario acao={atualizarFamilia} textoBotao="Salvar" mensagemOk="Salvo!">
              <div>
                <label className="rotulo" htmlFor="nome">
                  Nome da família
                </label>
                <input id="nome" name="nome" defaultValue={familia.nome} required maxLength={80} className="campo" />
              </div>
              <Interruptor
                name="borrarAtePostar"
                defaultChecked={familia.borrarAtePostar}
                titulo="Surpresa do dia"
                descricao="As fotos de hoje ficam borradas até a pessoa postar a dela."
              />
            </Formulario>
          </div>
        </section>
      )}

      {minhasFamilias.length > 1 && (
        <section className="space-y-2">
          <h2 className="subtitulo">Minhas famílias</h2>
          <ul className="cartao divide-y divide-borda overflow-hidden">
            {minhasFamilias.map(({ familia: f }) => (
              <li key={f.id} className="flex min-h-14 items-center justify-between px-4">
                <span className="font-semibold">{f.nome}</span>
                {f.id === familia.id ? (
                  <span className="rounded-full bg-marca-suave px-3 py-1 text-xs font-bold text-marca-forte">Aberta</span>
                ) : (
                  <form action={trocarFamiliaAtiva.bind(null, f.id)}>
                    <button className="btn-suave min-h-10 px-4 text-sm">Abrir</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="cartao group p-4">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-semibold">
          Entrar em outra família
          <span className="text-suave transition-transform group-open:rotate-45" aria-hidden>
            +
          </span>
        </summary>
        <div className="pt-4">
          <Formulario acao={entrarNaFamilia} textoBotao="Entrar">
            <input
              name="codigo"
              placeholder="Código de convite"
              required
              autoCapitalize="characters"
              autoComplete="off"
              className="campo text-center font-bold tracking-[0.3em] uppercase"
            />
          </Formulario>
        </div>
      </details>

      <BotaoConfirmar
        acao={sairDaFamilia}
        pergunta={`Sair de ${familia.nome}?`}
        detalhe="Você para de ver os check-ins e sai dos desafios desta família."
        textoConfirmar="Sair"
        className="btn-perigo w-full"
      >
        Sair da família
      </BotaoConfirmar>
    </div>
  );
}
