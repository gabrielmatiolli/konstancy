import { Trash } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { selecaoPessoa } from "@/lib/pessoa";
import { exigirFamilia } from "@/lib/familia";
import { deveBorrar, jaFezCheckinHoje, selecaoDoCartao } from "@/lib/consultas";
import { tempoRelativo } from "@/lib/datas";
import { apagarCheckin, apagarComentario } from "@/acoes/checkins";
import { Avatar } from "@/componentes/Avatar";
import { CartaoCheckin } from "@/componentes/CartaoCheckin";
import { FormComentario } from "@/componentes/FormComentario";
import { BotaoConfirmar } from "@/componentes/BotaoConfirmar";
import { Topo } from "@/componentes/Topo";

export const metadata = { title: "Check-in" };

export default async function PaginaCheckin({ params }: PageProps<"/checkin/[id]">) {
  const { usuario } = await exigirFamilia();
  const { id } = await params;

  // Não filtra pela família ativa: o push de outra família da pessoa abre aqui.
  const checkin = await prisma.checkin.findFirst({
    where: { id, familia: { membros: { some: { usuarioId: usuario.id } } } },
    select: {
      ...selecaoDoCartao(usuario.id),
      familiaId: true,
      familia: { select: { borrarAtePostar: true } },
      comentarios: {
        orderBy: { criadoEm: "asc" },
        select: { id: true, texto: true, criadoEm: true, usuario: { select: selecaoPessoa } },
      },
    },
  });
  if (!checkin) notFound();

  const borrado = deveBorrar(
    checkin,
    { id: usuario.id, postouHoje: await jaFezCheckinHoje(checkin.familiaId, usuario.id) },
    checkin.familia.borrarAtePostar,
  );

  const meu = checkin.usuarioId === usuario.id;

  return (
    <div className="space-y-5">
      <Topo
        voltar="/"
        titulo={meu ? "Seu check-in" : checkin.usuario.nome.split(" ")[0]}
        acao={
          meu && (
            <BotaoConfirmar
              acao={apagarCheckin.bind(null, checkin.id)}
              pergunta="Apagar este check-in?"
              detalhe="A foto some do feed e o dia deixa de contar nos desafios."
              textoConfirmar="Apagar"
              className="btn-icone text-suave"
            >
              <Trash className="size-5" aria-label="Apagar check-in" />
            </BotaoConfirmar>
          )
        }
      />

      <CartaoCheckin checkin={checkin} borrado={borrado} completo />

      <section id="comentarios" className="scroll-mt-4 space-y-4">
        <h2 className="subtitulo">
          Comentários{checkin.comentarios.length > 0 && ` · ${checkin.comentarios.length}`}
        </h2>
        {borrado ? (
          <p className="text-sm text-suave">Os comentários aparecem depois do seu check-in de hoje.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {checkin.comentarios.map((c) => (
                <li key={c.id} className="surgir flex gap-3">
                  <Avatar usuario={c.usuario} tamanho={34} />
                  <div className="min-w-0 flex-1">
                    <div className="rounded-xl rounded-tl-md bg-superficie px-4 py-2.5">
                      <p className="text-sm font-normal">{c.usuario.id === usuario.id ? "Você" : c.usuario.nome}</p>
                      <p className="text-[15px] break-words whitespace-pre-line">{c.texto}</p>
                    </div>
                    <p className="mt-1 flex items-center gap-3 pl-2 text-xs text-suave">
                      {tempoRelativo(c.criadoEm)}
                      {c.usuario.id === usuario.id && (
                        <BotaoConfirmar
                          acao={apagarComentario.bind(null, c.id)}
                          pergunta="Apagar este comentário?"
                          textoConfirmar="Apagar"
                          className="min-h-8 font-medium"
                        >
                          Apagar
                        </BotaoConfirmar>
                      )}
                    </p>
                  </div>
                </li>
              ))}
              {checkin.comentarios.length === 0 && (
                <li className="text-sm text-suave">Ninguém comentou ainda. Mande um incentivo!</li>
              )}
            </ul>
            <FormComentario checkinId={checkin.id} />
          </>
        )}
      </section>
    </div>
  );
}
