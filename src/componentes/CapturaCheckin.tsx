"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { criarCheckin } from "@/acoes/checkins";
import { estadoInicial } from "@/acoes/estado";

const ATIVIDADES = ["Corrida", "Caminhada", "Academia", "Bike", "Natação", "Funcional", "Yoga", "Futebol", "Outra"];
/** Lado maior da foto enviada. O servidor ainda reduz para 1440, mas isso corta o upload de ~5 MB para ~400 KB. */
const LADO_ENVIO = 2048;

/**
 * Reduz a foto no próprio aparelho antes de subir — câmera de celular gera
 * 4–12 MB, e no 4G isso trava o check-in. createImageBitmap já aplica a
 * orientação do EXIF.
 */
async function comprimir(arquivo: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_ENVIO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? arquivo;
  } catch {
    // HEIC em navegador sem suporte etc.: manda o original e o servidor resolve.
    return arquivo;
  }
}

export function CapturaCheckin() {
  const [estado, enviar, pendente] = useActionState(criarCheckin, estadoInicial);
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [atividade, setAtividade] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (previa && URL.revokeObjectURL(previa)), [previa]);

  function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
  }

  async function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!foto) return entrada.current?.click();
    const dados = new FormData(evento.currentTarget);
    dados.set("foto", await comprimir(foto), "checkin.jpg");
    startTransition(() => enviar(dados));
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-5">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => escolher(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        className="cartao relative grid aspect-[3/4] w-full place-items-center overflow-hidden"
      >
        {previa ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
          <img src={previa} alt="Prévia do check-in" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-suave">
            <span className="text-5xl">📸</span>
            Tirar foto do treino
          </span>
        )}
      </button>
      {previa && (
        <button type="button" className="btn w-full" onClick={() => entrada.current?.click()}>
          Trocar foto
        </button>
      )}

      <fieldset>
        <legend className="rotulo">Atividade</legend>
        <div className="flex flex-wrap gap-2">
          {ATIVIDADES.map((a) => (
            <label
              key={a}
              className={`btn min-h-9 cursor-pointer rounded-full px-3 ${atividade === a ? "border-marca text-marca" : ""}`}
            >
              <input
                type="radio"
                name="atividade"
                value={a}
                className="sr-only"
                checked={atividade === a}
                onChange={() => setAtividade(a)}
              />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="rotulo" htmlFor="duracaoMin">
          Duração (min) <span className="font-normal text-suave">— opcional</span>
        </label>
        <input id="duracaoMin" name="duracaoMin" type="number" inputMode="numeric" min={1} max={1440} className="campo" />
      </div>

      <div>
        <label className="rotulo" htmlFor="descricao">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={3}
          maxLength={500}
          placeholder="Como foi o treino?"
          className="campo resize-none"
        />
      </div>

      {estado.erro && (
        <p className="erro" role="alert">
          {estado.erro}
        </p>
      )}

      <button type="submit" className="btn-primario w-full py-4 text-base" disabled={pendente}>
        {pendente ? "Publicando…" : foto ? "Publicar check-in" : "Tirar foto"}
      </button>
    </form>
  );
}
