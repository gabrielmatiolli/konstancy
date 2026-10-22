import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigirFamilia } from "@/lib/familia";
import { deveBorrar, jaFezCheckinHoje, selecaoDoCartao } from "@/lib/consultas";
import { tempoRelativo } from "@/lib/datas";
import { apagarCheckin, apagarComentario } from "@/acoes/checkins";
import { Avatar } from "@/componentes/Avatar";
import { CartaoCheckin } from "@/componentes/CartaoCheckin";
import { FormComentario } from "@/componentes/FormComentario";
import { BotaoConfirmar } from "@/componentes/BotaoConfirmar";

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
        select: { id: true, texto: true, criadoEm: true, usuario: { select: { id: true, nome: true } } },
      },
    },
  });
  if (!checkin) notFound();

  const borrado = deveBorrar(
    checkin,
    { id: usuario.id, postouHoje: await jaFezCheckinHoje(checkin.familiaId, usuario.id) },
    checkin.familia.borrarAtePostar,
  );

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-suave">
        ← Voltar
      </Link>

      <CartaoCheckin checkin={checkin} borrado={borrado} completo />

      <section id="comentarios" className="space-y-4">
        <h2 className="font-semibold">Comentários</h2>
        {borrado ? (
          <p className="text-sm text-suave">Os comentários aparecem depois do seu check-in de hoje.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {checkin.comentarios.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <Avatar usuario={c.usuario} tamanho={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{c.usuario.nome}</span> {c.texto}
                    </p>
                    <p className="flex gap-3 text-xs text-suave">
                      {tempoRelativo(c.criadoEm)}
                      {c.usuario.id === usuario.id && (
                        <BotaoConfirmar
                          acao={apagarComentario.bind(null, c.id)}
                          pergunta="Apagar este comentário?"
                          className="text-xs text-suave underline"
                        >
                          apagar
                        </BotaoConfirmar>
                      )}
                    </p>
                  </div>
                </li>
              ))}
              {checkin.comentarios.length === 0 && <li className="text-sm text-suave">Seja o primeiro a comentar.</li>}
            </ul>
            <FormComentario checkinId={checkin.id} />
          </>
        )}
      </section>

      {checkin.usuarioId === usuario.id && (
        <BotaoConfirmar
          acao={apagarCheckin.bind(null, checkin.id)}
          pergunta="Apagar este check-in? Ele deixa de contar nos desafios."
          className="btn-perigo w-full"
        >
          Apagar check-in
        </BotaoConfirmar>
      )}
    </div>
  );
}
