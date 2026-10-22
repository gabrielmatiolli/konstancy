"use client";

import { useEffect, useState } from "react";
import { enviarPushDeTeste, removerInscricao, salvarInscricao } from "@/acoes/push";

type Estado = "carregando" | "sem-https" | "sem-suporte" | "instalar-ios" | "bloqueado" | "desligado" | "ligado";

function chaveVapid(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function instalado() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
}

/**
 * Liga/desliga o push neste aparelho. No iPhone o Web Push só existe com o
 * app instalado na tela de início (iOS 16.4+) — antes disso, ensina a instalar.
 */
export function AtivarNotificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    (async () => {
      // Service worker e push só existem em HTTPS (ou localhost). Aberto pelo
      // IP da rede em http://, o navegador simplesmente não oferece as APIs.
      if (!window.isSecureContext) return setEstado("sem-https");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setEstado(ehIOS() && !instalado() ? "instalar-ios" : "sem-suporte");
      }
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();
      if (inscricao) {
        // Reenvia sempre: garante que o servidor tem a inscrição deste aparelho na conta atual.
        await salvarInscricao(inscricao.toJSON(), navigator.userAgent);
        setEstado("ligado");
      } else {
        setEstado("desligado");
      }
    })();
  }, []);

  async function ligar() {
    setOcupado(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return setEstado(permissao === "denied" ? "bloqueado" : "desligado");
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveVapid(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await salvarInscricao(inscricao.toJSON(), navigator.userAgent);
      setEstado("ligado");
      await enviarPushDeTeste();
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();
      if (inscricao) {
        await removerInscricao(inscricao.endpoint);
        await inscricao.unsubscribe();
      }
      setEstado("desligado");
    } finally {
      setOcupado(false);
    }
  }

  const textos: Partial<Record<Estado, string>> = {
    carregando: "Verificando…",
    "sem-https":
      "As notificações precisam de conexão segura (https://). Abra o app pelo endereço com https para ativar.",
    "sem-suporte": "Este navegador não suporta notificações.",
    "instalar-ios":
      "No iPhone, as notificações só funcionam com o app instalado: toque em Compartilhar → “Adicionar à Tela de Início” e abra o Saúde Check por lá.",
    bloqueado: "As notificações estão bloqueadas. Libere nas configurações do navegador para este site.",
    desligado: "Receba um aviso quando alguém da família fizer check-in.",
    ligado: "Notificações ligadas neste aparelho.",
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-suave">{textos[estado]}</p>
      {estado === "desligado" && (
        <button className="btn-primario w-full" onClick={ligar} disabled={ocupado}>
          Ativar notificações
        </button>
      )}
      {estado === "ligado" && (
        <div className="flex gap-2">
          <button className="btn flex-1" onClick={() => enviarPushDeTeste()} disabled={ocupado}>
            Testar
          </button>
          <button className="btn flex-1" onClick={desligar} disabled={ocupado}>
            Desligar
          </button>
        </div>
      )}
    </div>
  );
}
