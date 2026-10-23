"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
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
      "No iPhone, as notificações só funcionam com o app instalado: toque em Compartilhar → “Adicionar à Tela de Início” e abra o Konstancy por lá.",
    bloqueado:
      "Os avisos estão bloqueados para este app. No Android: toque no cadeado ao lado do endereço (ou segure o ícone do app → Informações) → Notificações → Permitir.",
    desligado: "Saiba na hora quando alguém da família treinar, curtir ou comentar.",
    ligado: "Ligados. Você recebe check-ins, curtidas, comentários e desafios.",
  };

  const ligado = estado === "ligado";

  return (
    <section className="cartao p-4">
      <div className="flex items-start gap-4">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
            ligado ? "bg-marca-suave text-marca-forte" : "bg-superficie-2 text-suave"
          }`}
        >
          {ligado ? <Bell className="size-6" /> : <BellOff className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Avisos neste aparelho</p>
          <p className="mt-0.5 text-sm text-suave">{textos[estado]}</p>
        </div>
      </div>
      {estado === "desligado" && (
        <button className="btn-primario mt-4 w-full" onClick={ligar} disabled={ocupado}>
          {ocupado ? <Loader2 className="size-5 animate-spin" /> : <Bell className="size-5" />} Ativar avisos
        </button>
      )}
      {ligado && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="btn-suave" onClick={() => enviarPushDeTeste()} disabled={ocupado}>
            Enviar teste
          </button>
          <button className="btn-suave" onClick={desligar} disabled={ocupado}>
            Desligar
          </button>
        </div>
      )}
    </section>
  );
}
