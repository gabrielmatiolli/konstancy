"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Senha nova com "mostrar": no celular é mais fácil conferir do que digitar duas vezes. */
export function CampoSenha({ rotulo = "Senha nova", name = "senha" }: { rotulo?: string; name?: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div>
      <label className="rotulo" htmlFor={name}>
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visivel ? "text" : "password"}
          autoComplete="new-password"
          minLength={6}
          maxLength={100}
          required
          autoFocus
          className="campo pr-14"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          className="btn-icone absolute top-1/2 right-1 -translate-y-1/2 text-suave"
        >
          {visivel ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      <p className="mt-1 text-xs text-suave">Pelo menos 6 caracteres.</p>
    </div>
  );
}
