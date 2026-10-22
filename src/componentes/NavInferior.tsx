"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, House, LayoutGrid, Trophy, User } from "lucide-react";

const itens = [
  { href: "/", rotulo: "Início", Icone: House },
  { href: "/painel", rotulo: "Painel", Icone: LayoutGrid },
  { href: "/checkin/novo", rotulo: "Check-in", Icone: Camera, destaque: true },
  { href: "/desafios", rotulo: "Desafios", Icone: Trophy },
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
      <ul className="mx-auto grid h-(--altura-nav) max-w-lg grid-cols-5">
        {itens.map(({ href, rotulo, Icone, destaque }) => {
          const marcado = ativo(href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={marcado ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center justify-end gap-1 pb-2 text-[11px] font-semibold transition-colors ${
                  marcado ? "text-marca-forte" : "text-suave"
                }`}
              >
                {destaque ? (
                  <>
                    {/* Botão elevado; o espaço reservado mantém o rótulo na linha dos outros. */}
                    <span className="absolute -top-5 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full border-4 border-fundo bg-marca-forte text-white transition-transform active:scale-90 dark:text-marca-texto">
                      <Icone className="size-6" strokeWidth={2.2} />
                    </span>
                    <span className="size-6" aria-hidden />
                  </>
                ) : (
                  <Icone className="size-6" strokeWidth={marcado ? 2.4 : 1.9} />
                )}
                <span>{rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
