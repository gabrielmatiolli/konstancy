"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

type Modo = "oculto" | "android" | "ios";

const CHAVE_DISPENSADO = "saudecheck:instalar-dispensado";

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function instalado() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
}

/**
 * Convida a instalar o app na tela inicial. Android (Chrome, Samsung
 * Internet, Edge): botão que abre o instalador do sistema. iPhone: passo a
 * passo, porque o Safari não deixa o site abrir o instalador.
 * `dispensavel`: no feed, some quando a pessoa fecha (lembrado no aparelho).
 */
export function InstalarApp({ dispensavel = false }: { dispensavel?: boolean }) {
  const [modo, setModo] = useState<Modo>("oculto");

  useEffect(() => {
    function avaliar() {
      if (instalado()) return setModo("oculto");
      if (dispensavel) {
        try {
          if (localStorage.getItem(CHAVE_DISPENSADO)) return setModo("oculto");
        } catch {
          // armazenamento bloqueado: mostra mesmo assim
        }
      }
      if (window.__promptInstalacao) return setModo("android");
      setModo(ehIOS() ? "ios" : "oculto");
    }
    avaliar();
    window.addEventListener("saudecheck:instalavel", avaliar);
    return () => window.removeEventListener("saudecheck:instalavel", avaliar);
  }, [dispensavel]);

  if (modo === "oculto") return null;

  async function instalar() {
    const evento = window.__promptInstalacao;
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") {
      window.__promptInstalacao = null;
      setModo("oculto");
    }
  }

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      // sem armazenamento: some só nesta visita
    }
    setModo("oculto");
  }

  return (
    <section className="cartao surgir relative flex gap-4 p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-marca-suave text-marca-forte">
        <Smartphone className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="pr-8 font-bold">Instale o Saúde Check</p>
        {modo === "android" ? (
          <>
            <p className="mt-0.5 text-sm text-suave">Abre mais rápido, em tela cheia, e recebe os avisos da família.</p>
            <button type="button" className="btn-primario mt-3 min-h-11 w-full" onClick={instalar}>
              <Download className="size-5" /> Instalar app
            </button>
          </>
        ) : (
          <p className="mt-0.5 text-sm text-suave">
            Toque em <Share className="inline size-4 align-[-2px]" aria-label="Compartilhar" /> e depois em{" "}
            <strong className="text-texto">Adicionar à Tela de Início</strong>. No iPhone, os avisos só funcionam com o
            app instalado.
          </p>
        )}
      </div>
      {dispensavel && (
        <button type="button" aria-label="Agora não" className="btn-icone absolute top-1 right-1 size-10" onClick={dispensar}>
          <X className="size-5 text-suave" />
        </button>
      )}
    </section>
  );
}
