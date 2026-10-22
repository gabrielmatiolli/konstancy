import type { LucideIcon } from "lucide-react";

/** Estado vazio: ícone, uma frase e, se houver, o próximo passo. */
export function Vazio({ icone: Icone, titulo, texto, children }: {
  icone: LucideIcon;
  titulo: string;
  texto?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-marca-suave text-marca-forte">
        <Icone className="size-8" strokeWidth={1.8} />
      </span>
      <p className="text-lg font-bold">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-sm text-suave">{texto}</p>}
      {children && <div className="mt-5 w-full max-w-xs">{children}</div>}
    </div>
  );
}
