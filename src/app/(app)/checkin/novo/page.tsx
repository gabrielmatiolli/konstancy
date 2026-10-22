import { CapturaCheckin } from "@/componentes/CapturaCheckin";

export const metadata = { title: "Novo check-in" };

export default function PaginaNovoCheckin() {
  return (
    <div className="space-y-5">
      <h1 className="titulo-pagina">Check-in de hoje</h1>
      <CapturaCheckin />
    </div>
  );
}
