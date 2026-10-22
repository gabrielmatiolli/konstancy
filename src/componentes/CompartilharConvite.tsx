"use client";

import { useState } from "react";

export function CompartilharConvite({ codigo, familia }: { codigo: string; familia: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = `${location.origin}/convite/${codigo}`;
    const texto = `Entra na ${familia} no Saúde Check pra gente treinar junto! 💪`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Saúde Check", text: texto, url });
        return;
      } catch {
        // cancelado — cai no copiar
      }
    }
    await navigator.clipboard.writeText(`${texto} ${url}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-3xl font-bold tracking-[0.3em]">{codigo}</p>
      <button type="button" className="btn-primario w-full" onClick={compartilhar}>
        {copiado ? "Link copiado!" : "Convidar pelo WhatsApp / link"}
      </button>
    </div>
  );
}
