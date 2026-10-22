import { Check } from "lucide-react";

/** Marca provisória: o mesmo "check" do ícone do app. */
export function Marca({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <span
      className="grid place-items-center rounded-[28%] bg-marca-forte text-white dark:text-marca-texto"
      style={{ width: tamanho, height: tamanho }}
    >
      <Check style={{ width: tamanho * 0.55, height: tamanho * 0.55 }} strokeWidth={3.2} />
    </span>
  );
}
