"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, LayoutGrid, PanelsTopLeft, Plus, User } from "lucide-react";

const itens = [
  { href: "/", rotulo: "Início", Icone: PanelsTopLeft },
  { href: "/painel", rotulo: "Painel", Icone: LayoutGrid },
  { href: "/checkin/novo", rotulo: "Check-in", Icone: Plus, destaque: true },
  { href: "/desafios", rotulo: "Desafios", Icone: ChartNoAxesColumn },
  { href: "/perfil", rotulo: "Perfil", Icone: User },
];

/**
 * Barra fixa embaixo, ao alcance do polegar. Fundo sólido de propósito:
 * backdrop-filter (vidro fosco) pesa na rolagem de Android de entrada.
 */
export function NavInferior() {
  const caminho = usePathname();
  // O check-in é uma tela cheia com o próprio botão de fechar.
  if (caminho === "/checkin/novo") return null;
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid h-(--altura-nav) max-w-lg grid-cols-5 items-center">
        {itens.map(({ href, rotulo, Icone, destaque }) => {
          const marcado = ativo(href);
          return (
            <li key={href} className="flex justify-center">
              {destaque ? (
                <Link
                  href={href}
                  aria-label={rotulo}
                  className="grid size-[52px] place-items-center rounded-[14px] bg-marca text-marca-texto transition-transform active:scale-90"
                >
                  <Icone className="size-6" strokeWidth={2} />
                </Link>
              ) : (
                <Link
                  href={href}
                  aria-current={marcado ? "page" : undefined}
                  className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                    marcado ? "font-semibold text-marca-forte" : "font-normal text-suave"
                  }`}
                >
                  <Icone className="size-[22px]" strokeWidth={marcado ? 1.9 : 1.5} />
                  {rotulo}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
