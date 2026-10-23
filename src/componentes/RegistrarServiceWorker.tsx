"use client";

import { useEffect } from "react";

export interface EventoInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Guardado aqui porque o Chrome do Android dispara o evento uma vez só, às vezes antes da tela montar. */
    __promptInstalacao?: EventoInstalacao | null;
  }
}

export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((erro) => {
        console.error("Falha ao registrar o service worker", erro);
      });
    }

    function aoOferecer(evento: Event) {
      evento.preventDefault(); // o app mostra o próprio botão "Instalar"
      window.__promptInstalacao = evento as EventoInstalacao;
      window.dispatchEvent(new Event("konstancy:instalavel"));
    }
    function aoInstalar() {
      window.__promptInstalacao = null;
      window.dispatchEvent(new Event("konstancy:instalavel"));
    }
    window.addEventListener("beforeinstallprompt", aoOferecer);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoOferecer);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);
  return null;
}
