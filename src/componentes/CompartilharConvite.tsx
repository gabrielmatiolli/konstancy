"use client";

import { useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Copia texto mesmo sem a Clipboard API — ela (e o navigator.share) só existe
 * em conexão segura; aberto por http://IP-da-rede no celular, não está lá.
 */
async function copiar(texto: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // permissão negada — tenta o caminho antigo
    }
  }
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, texto.length); // iOS ignora select() sozinho
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

export function CompartilharConvite({ codigo, familia }: { codigo: string; familia: string }) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "manual">("parado");
  const [linkManual, setLinkManual] = useState("");
  const campo = useRef<HTMLInputElement>(null);

  async function compartilhar() {
    const url = `${location.origin}/convite/${codigo}`;
    const texto = `Entra na ${familia} no Konstancy pra gente treinar junto! 💪`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Konstancy", text: texto, url });
        return;
      } catch (erro) {
        // Fechar a folha de compartilhamento não é erro.
        if (erro instanceof DOMException && erro.name === "AbortError") return;
      }
    }

    if (await copiar(`${texto} ${url}`)) {
      setEstado("copiado");
      setTimeout(() => setEstado("parado"), 2000);
    } else {
      // Último recurso: mostra o link selecionado para copiar à mão.
      setLinkManual(url);
      setEstado("manual");
      requestAnimationFrame(() => campo.current?.select());
    }
  }

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-superficie-2 py-3 text-center text-3xl font-light tracking-[0.3em] tabular-nums select-all">
        {codigo}
      </p>
      <button type="button" className="btn-primario w-full" onClick={compartilhar}>
        {estado === "copiado" ? (
          <>
            <Check className="size-5" /> Link copiado!
          </>
        ) : (
          <>
            <Share2 className="size-5" /> Enviar convite
          </>
        )}
      </button>
      {estado === "manual" && (
        <div className="space-y-1 text-left">
          <p className="text-xs text-suave">Não deu para copiar automaticamente. Segure o link abaixo e copie:</p>
          <input
            ref={campo}
            readOnly
            value={linkManual}
            onFocus={(e) => e.currentTarget.select()}
            className="campo text-sm"
          />
        </div>
      )}
    </div>
  );
}
