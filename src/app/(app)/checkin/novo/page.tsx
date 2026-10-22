import Link from "next/link";
import { X } from "lucide-react";
import { CapturaCheckin } from "@/componentes/CapturaCheckin";

export const metadata = { title: "Novo check-in" };

export default function PaginaNovoCheckin() {
  return (
    <div>
      <header className="mb-5 flex min-h-12 items-center gap-2">
        <Link href="/" aria-label="Fechar" className="btn-icone -ml-2.5">
          <X className="size-6" />
        </Link>
        <h1 className="titulo-pagina">Check-in de hoje</h1>
      </header>
      <CapturaCheckin />
    </div>
  );
}
