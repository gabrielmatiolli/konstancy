"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { removerFoto, trocarFoto } from "@/acoes/perfil";
import { estadoInicial } from "@/acoes/estado";
import { comprimirFoto, LIMITE_ENVIO, MENSAGEM_FOTO_GRANDE } from "@/lib/comprimirFoto";
import { Avatar } from "@/componentes/Avatar";
import type { Pessoa } from "@/lib/pessoa";

/**
 * Trocar a foto de perfil: toca na foto, escolhe (o Android oferece câmera e
 * galeria no mesmo seletor), e ela sobe já reduzida a 640px — o servidor
 * recorta em 256px.
 */
export function EditorDeFoto({ pessoa }: { pessoa: Pessoa }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    const leve = await comprimirFoto(arquivo, 640);
    if (leve.size > LIMITE_ENVIO) return setErro(MENSAGEM_FOTO_GRANDE);
    const url = URL.createObjectURL(leve);
    setPrevia(url);
    iniciar(async () => {
      const dados = new FormData();
      dados.set("foto", leve, "perfil.jpg");
      const resultado = await trocarFoto(estadoInicial, dados);
      if (resultado.erro) setErro(resultado.erro);
      setPrevia(null);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          escolher(e.target.files?.[0]);
          e.target.value = ""; // permite escolher a mesma foto de novo
        }}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={pendente}
        aria-label="Trocar foto de perfil"
        className="relative rounded-full transition-transform active:scale-95"
      >
        {previa ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
          <img src={previa} alt="" className="size-24 rounded-full object-cover" />
        ) : (
          <Avatar usuario={pessoa} tamanho={96} />
        )}
        <span className="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full border-[3px] border-fundo bg-marca-forte text-white dark:text-marca-texto">
          {pendente ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </span>
      </button>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={pendente}
          className="min-h-10 rounded-full px-3 text-sm font-semibold text-marca-forte active:bg-superficie-2"
        >
          {pessoa.avatarVersao ? "Trocar foto" : "Adicionar foto"}
        </button>
        {pessoa.avatarVersao > 0 && (
          <button
            type="button"
            disabled={pendente}
            onClick={() => iniciar(async () => void (await removerFoto()))}
            className="min-h-10 rounded-full px-3 text-sm font-semibold text-suave active:bg-superficie-2"
          >
            Remover
          </button>
        )}
      </div>
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}
