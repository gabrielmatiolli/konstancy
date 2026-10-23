import { Check } from "lucide-react";

// Cor estável por pessoa, derivada do id — sem foto de perfil por enquanto.
const CORES = ["#e8590c", "#1c7ed6", "#9c36b5", "#d6336c", "#0c8599", "#c08a00", "#5f3dc4", "#2b8a3e"];

function corDe(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length];
}

export function Avatar({
  usuario,
  tamanho = 36,
  marcado,
}: {
  /** Sem `avatarVersao` (ou 0), mostra a inicial colorida. */
  usuario: { id: string; nome: string; avatarVersao?: number };
  tamanho?: number;
  /** Fez check-in hoje: anel e selo verdes. */
  marcado?: boolean;
}) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: tamanho, height: tamanho }}>
      <span
        title={usuario.nome}
        className={`grid size-full place-items-center rounded-full font-bold text-white ${
          marcado === false ? "opacity-45 grayscale" : ""
        } ${marcado ? "ring-[3px] ring-marca ring-offset-2 ring-offset-fundo" : ""}`}
        style={{ background: corDe(usuario.id), fontSize: tamanho * 0.42 }}
      >
        {usuario.avatarVersao ? (
          // A versão na URL troca a cada foto nova: o cache longo nunca mostra a antiga.
          // eslint-disable-next-line @next/next/no-img-element -- 256px já otimizada no servidor
          <img
            src={`/api/avatar/${usuario.id}?v=${usuario.avatarVersao}`}
            alt=""
            width={tamanho}
            height={tamanho}
            loading="lazy"
            decoding="async"
            className="size-full rounded-full object-cover"
          />
        ) : (
          usuario.nome.trim().charAt(0).toUpperCase()
        )}
      </span>
      {marcado && (
        <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-fundo bg-marca text-white">
          <Check className="size-3" strokeWidth={3.5} />
        </span>
      )}
    </span>
  );
}
