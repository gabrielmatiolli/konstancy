"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Ícones provisórios em texto — o design definitivo troca por SVG.
const itens = [
  { href: "/", rotulo: "Início", icone: "⌂" },
  { href: "/painel", rotulo: "Painel", icone: "▦" },
  { href: "/checkin/novo", rotulo: "Check-in", icone: "+", destaque: true },
  { href: "/desafios", rotulo: "Desafios", icone: "🏆" },
  { href: "/perfil", rotulo: "Perfil", icone: "☺" },
];

export function NavInferior() {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid h-(--altura-nav) max-w-lg grid-cols-5">
        {itens.map((item) => (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              aria-current={ativo(item.href) ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                ativo(item.href) ? "font-semibold text-marca" : "text-suave"
              }`}
            >
              {item.destaque ? (
                <span className="grid size-11 place-items-center rounded-full bg-marca text-2xl leading-none text-marca-texto">
                  {item.icone}
                </span>
              ) : (
                <>
                  <span className="text-xl leading-none" aria-hidden>
                    {item.icone}
                  </span>
                  {item.rotulo}
                </>
              )}
              {item.destaque && <span className="sr-only">{item.rotulo}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
