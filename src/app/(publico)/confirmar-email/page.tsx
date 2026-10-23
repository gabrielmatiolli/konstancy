import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { codigoPendente, mascararEmail } from "@/lib/codigos";
import { confirmarEmail, enviarConfirmacao } from "@/acoes/verificacao";
import { BotaoReenviar } from "@/componentes/BotaoReenviar";
import { CampoCodigo } from "@/componentes/CampoCodigo";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Confirmar e-mail" };

/**
 * Confirmação do e-mail por código. Não bloqueia o uso do app ("Fazer
 * depois"), mas sem ela a recuperação de senha pode ir para um e-mail errado.
 * Abrir a página não envia nada: o envio é sempre um toque (ou o cadastro).
 */
export default async function PaginaConfirmarEmail({ searchParams }: PageProps<"/confirmar-email">) {
  const usuario = await exigirUsuario();
  const { depois: bruto } = await searchParams;
  const depois = typeof bruto === "string" && bruto.startsWith("/") && !bruto.startsWith("//") ? bruto : "/";
  if (usuario.emailVerificado) redirect(depois);

  const pendente = await codigoPendente(usuario.id, "CONFIRMAR_EMAIL", usuario.email);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 grid size-14 place-items-center rounded-xl bg-marca-suave text-marca-forte">
          <MailCheck className="size-7" />
        </span>
        <h1 className="text-xl font-light">Confirme seu e-mail</h1>
        <p className="mt-1 text-[15px] text-suave">
          {pendente ? "Enviamos um código de 6 números para" : "Vamos enviar um código de 6 números para"}{" "}
          <strong className="text-texto">{mascararEmail(usuario.email)}</strong>.
        </p>
      </div>

      {pendente ? (
        <>
          <Formulario acao={confirmarEmail} textoBotao="Confirmar" textoEnviando="Conferindo…">
            <input type="hidden" name="depois" value={depois} />
            <CampoCodigo />
          </Formulario>
          <p className="text-center text-sm text-suave">Não chegou? Olhe também no spam.</p>
          <BotaoReenviar acao={enviarConfirmacao} esperaInicial={pendente.esperaReenvio} />
        </>
      ) : (
        <BotaoReenviar acao={enviarConfirmacao} texto="Enviar código" destaque />
      )}

      <Link href={depois} className="block min-h-11 text-center text-[15px] font-medium text-suave">
        Fazer depois
      </Link>
    </div>
  );
}
