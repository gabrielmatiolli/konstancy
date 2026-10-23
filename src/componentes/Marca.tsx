/**
 * Símbolo do Konstancy: um K montado com "dias" — os mesmos quadrados de
 * cantos suaves da grade da semana. O último quadrado (a ponta de baixo) é o
 * dia de hoje, na cor do texto.
 */
const QUADRADOS: [number, number][] = [
  [0, 0], [0, 10], [0, 20], [0, 30], [0, 40],
  [10, 20], [20, 10], [30, 0], [20, 30],
];

export function Marca({ tamanho = 56, fundo = true }: { tamanho?: number; fundo?: boolean }) {
  const simbolo = (
    <svg
      viewBox="0 0 38 48"
      width={fundo ? tamanho * 0.5 : tamanho}
      height={fundo ? tamanho * 0.6 : tamanho * 1.26}
      role="img"
      aria-label="Konstancy"
    >
      {QUADRADOS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="2.5" className="fill-marca" />
      ))}
      <rect x="30" y="40" width="8" height="8" rx="2.5" className={fundo ? "fill-white" : "fill-texto"} />
    </svg>
  );
  if (!fundo) return simbolo;
  return (
    <span
      className="grid place-items-center rounded-[28%] bg-floresta"
      style={{ width: tamanho, height: tamanho }}
    >
      {simbolo}
    </span>
  );
}
