import Link from "next/link";
import { CheckCircle2, MailWarning } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { formatarTelefone } from "@/lib/telefone";
import { atualizarPerfil } from "@/acoes/perfil";
import { EditorDeFoto } from "@/componentes/EditorDeFoto";
import { Formulario } from "@/componentes/Formulario";
import { Topo } from "@/componentes/Topo";

export const metadata = { title: "Editar perfil" };

export default async function PaginaEditarPerfil() {
  const usuario = await exigirUsuario();

  return (
    <div className="space-y-6">
      <Topo voltar="/perfil" titulo="Editar perfil" />

      <EditorDeFoto pessoa={usuario} />

      <Formulario acao={atualizarPerfil} textoBotao="Salvar" textoEnviando="Salvando…" mensagemOk="Perfil salvo!">
        <div>
          <label className="rotulo" htmlFor="nome">
            Nome
          </label>
          <input id="nome" name="nome" defaultValue={usuario.nome} autoComplete="name" required maxLength={80} className="campo" />
        </div>

        <div>
          <label className="rotulo" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" defaultValue={usuario.email} autoComplete="email" required className="campo" />
          {usuario.emailVerificado ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-marca-forte">
              <CheckCircle2 className="size-4" /> Confirmado
            </p>
          ) : (
            <Link
              href="/confirmar-email?depois=/perfil/editar"
              className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ouro"
            >
              <MailWarning className="size-4" /> Não confirmado — toque para confirmar
            </Link>
          )}
          <p className="mt-1 text-xs text-suave">Se trocar, enviamos um código para o e-mail novo.</p>
        </div>

        <div>
          <label className="rotulo" htmlFor="telefone">
            Celular <span className="font-normal text-suave">(para entrar com ele)</span>
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 98765-4321"
            defaultValue={usuario.telefone ? formatarTelefone(usuario.telefone) : ""}
            className="campo"
          />
          <p className="mt-1 text-xs text-suave">Deixe vazio para remover.</p>
        </div>
      </Formulario>
    </div>
  );
}
