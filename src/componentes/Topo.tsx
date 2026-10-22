import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Cabeçalho das telas: título grande, voltar opcional e ação à direita. */
export function Topo({
  titulo,
  sobretitulo,
  voltar,
  acao,
}: {
  titulo: React.ReactNode;
  sobretitulo?: React.ReactNode;
  /** Caminho do botão voltar. */
  voltar?: string;
  acao?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex min-h-12 items-center gap-2">
      {voltar && (
        <Link href={voltar} aria-label="Voltar" className="btn-icone -ml-2.5">
          <ChevronLeft className="size-6" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        {sobretitulo && <p className="truncate text-sm font-medium text-suave">{sobretitulo}</p>}
        <h1 className="titulo-pagina truncate">{titulo}</h1>
      </div>
      {acao}
    </header>
  );
}
