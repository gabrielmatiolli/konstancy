"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { Camera, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { criarCheckin } from "@/acoes/checkins";
import { estadoInicial } from "@/acoes/estado";
import { comprimirFoto, LIMITE_ENVIO, MENSAGEM_FOTO_GRANDE } from "@/lib/comprimirFoto";

const ATIVIDADES = ["Caminhada", "Corrida", "Academia", "Bike", "Funcional", "Natação", "Yoga", "Futebol", "Dança", "Outra"];
const DURACOES = [15, 30, 45, 60, 90];

export function CapturaCheckin() {
  const [estado, enviar, pendente] = useActionState(criarCheckin, estadoInicial);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (previa && URL.revokeObjectURL(previa)), [previa]);

  // Comprime assim que a foto chega: a prévia já é a versão leve (menos
  // memória no Android) e o "Publicar" não espera nada além da rede.
  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setPreparando(true);
    setErroFoto(null);
    const leve = await comprimirFoto(arquivo);
    if (leve.size > LIMITE_ENVIO) {
      // Compressão falhou (formato que o navegador não abre) e o original é grande demais.
      setErroFoto(MENSAGEM_FOTO_GRANDE);
      setPreparando(false);
      return;
    }
    setFoto(leve);
    setPrevia(URL.createObjectURL(leve));
    setPreparando(false);
  }

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!foto) return camera.current?.click();
    const dados = new FormData(evento.currentTarget);
    dados.set("foto", foto, "checkin.jpg");
    startTransition(() => enviar(dados));
  }

  const ocupado = pendente || preparando;

  return (
    <form onSubmit={aoEnviar} className="space-y-6 pb-28">
      {/* Câmera direto (capture) e galeria (sem capture): no Android são duas portas diferentes. */}
      <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1}
        onChange={(e) => escolher(e.target.files?.[0])} />
      <input ref={galeria} type="file" accept="image/*" className="sr-only" tabIndex={-1}
        onChange={(e) => escolher(e.target.files?.[0])} />

      {previa ? (
        <div className="relative overflow-hidden rounded-2xl bg-superficie-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
          <img src={previa} alt="Prévia do check-in" className="max-h-[60svh] w-full object-cover" />
          <button type="button" onClick={() => camera.current?.click()}
            className="btn absolute right-3 bottom-3 min-h-10 border-transparent bg-black/60 px-4 text-sm text-white">
            <RefreshCw className="size-4" /> Trocar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button type="button" onClick={() => camera.current?.click()} disabled={preparando}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-marca/50 bg-marca-suave text-marca-forte transition-transform active:scale-[0.99]">
            {preparando ? (
              <Loader2 className="size-10 animate-spin" />
            ) : (
              <span className="grid size-16 place-items-center rounded-2xl bg-marca text-marca-texto">
                <Camera className="size-8" />
              </span>
            )}
            <span className="text-lg font-normal">{preparando ? "Preparando a foto…" : "Tirar foto do treino"}</span>
          </button>
          <button type="button" className="btn-suave w-full" onClick={() => galeria.current?.click()} disabled={preparando}>
            <ImagePlus className="size-5" /> Escolher da galeria
          </button>
        </div>
      )}

      <fieldset>
        <legend className="rotulo">O que você fez?</legend>
        <div className="flex flex-wrap gap-2">
          {ATIVIDADES.map((a) => (
            <label key={a} className="chip">
              <input type="radio" name="atividade" value={a} className="sr-only" />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="rotulo">
          Quanto tempo? <span className="font-normal text-suave">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {DURACOES.map((d) => (
            <label key={d} className="chip tabular-nums">
              <input type="radio" name="duracaoMin" value={d} className="sr-only" />
              {d < 60 ? `${d} min` : d === 60 ? "1 h" : "1h30"}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="rotulo" htmlFor="descricao">
          Quer contar algo? <span className="font-normal text-suave">(opcional)</span>
        </label>
        <textarea id="descricao" name="descricao" rows={3} maxLength={500} placeholder="Como foi o treino?"
          className="campo resize-none" />
      </div>

      {erroFoto && (
        <p className="erro" role="alert">
          {erroFoto}
        </p>
      )}
      {estado.erro && (
        <p className="erro" role="alert">
          {estado.erro}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="submit" className="btn-primario mx-auto flex min-h-14 w-full max-w-lg text-base" disabled={ocupado}>
          {pendente ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Publicando…
            </>
          ) : foto ? (
            "Publicar check-in"
          ) : (
            <>
              <Camera className="size-5" /> Tirar foto
            </>
          )}
        </button>
      </div>
    </form>
  );
}
