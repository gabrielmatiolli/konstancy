import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { lerRecuperacao } from "@/lib/auth";
import { codigoPendente, mascararEmail } from "@/lib/codigos";
import { conferirCodigoDeRecuperacao, reenviarRecuperacao } from "@/acoes/verificacao";
import { BotaoReenviar } from "@/componentes/BotaoReenviar";
import { CampoCodigo } from "@/componentes/CampoCodigo";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Recuperar senha" };

export default async function PaginaCodigoDeRecuperacao() {
  const processo = await lerRecuperacao();
  if (!processo) redirect("/recuperar");
  if (processo.verificado) redirect("/recuperar/nova-senha");

  const usuario = await prisma.usuario.findUnique({ where: { id: processo.usuarioId }, select: { email: true } });
  if (!usuario) redirect("/recuperar");
  const pendente = await codigoPendente(processo.usuarioId, "RECUPERAR_SENHA", usuario.email);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 grid size-14 place-items-center rounded-xl bg-marca-suave text-marca-forte">
          <MailCheck className="size-7" />
        </span>
        <h1 className="text-xl font-light">Digite o código</h1>
        <p className="mt-1 text-[15px] text-suave">
          Enviamos 6 números para <strong className="text-texto">{mascararEmail(usuario.email)}</strong>.
        </p>
      </div>
      <Formulario acao={conferirCodigoDeRecuperacao} textoBotao="Continuar" textoEnviando="Conferindo…">
        <CampoCodigo />
      </Formulario>
      <p className="text-center text-sm text-suave">Não chegou? Olhe também no spam.</p>
      <BotaoReenviar acao={reenviarRecuperacao} esperaInicial={pendente?.esperaReenvio ?? 0} />
      <Link href="/entrar" className="block min-h-11 text-center text-[15px] font-medium text-suave">
        Voltar para o login
      </Link>
    </div>
  );
}
