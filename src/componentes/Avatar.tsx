// Cor estável por pessoa, derivada do id — sem foto de perfil por enquanto.
const CORES = ["#f97316", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#6366f1", "#22c55e"];

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
  usuario: { id: string; nome: string };
  tamanho?: number;
  /** Anel verde: fez check-in hoje. */
  marcado?: boolean;
}) {
  return (
    <span
      title={usuario.nome}
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${
        marcado ? "ring-2 ring-marca ring-offset-2 ring-offset-fundo" : ""
      }`}
      style={{ width: tamanho, height: tamanho, background: corDe(usuario.id), fontSize: tamanho * 0.42 }}
    >
      {usuario.nome.trim().charAt(0).toUpperCase()}
    </span>
  );
}
