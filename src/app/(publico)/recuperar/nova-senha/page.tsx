import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { lerRecuperacao } from "@/lib/auth";
import { redefinirSenha } from "@/acoes/verificacao";
import { CampoSenha } from "@/componentes/CampoSenha";
import { Formulario } from "@/componentes/Formulario";

export const metadata = { title: "Nova senha" };

export default async function PaginaNovaSenha() {
  const processo = await lerRecuperacao();
  if (!processo?.verificado) redirect("/recuperar");

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-marca-suave text-marca-forte">
          <LockKeyhole className="size-7" />
        </span>
        <h1 className="text-xl font-extrabold">Crie uma senha nova</h1>
        <p className="mt-1 text-[15px] text-suave">Os outros aparelhos conectados vão precisar entrar de novo.</p>
      </div>
      <Formulario acao={redefinirSenha} textoBotao="Salvar e entrar" textoEnviando="Salvando…">
        <CampoSenha />
      </Formulario>
    </div>
  );
}
