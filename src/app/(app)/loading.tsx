/**
 * Esqueleto mostrado na hora do toque, enquanto o servidor responde. Em 4G
 * fraco a próxima tela pode levar segundos; sem isto, o app parece travado.
 */
export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-5">
      <div className="space-y-2 pt-1">
        <div className="esqueleto h-4 w-28 rounded-full" />
        <div className="esqueleto h-7 w-44 rounded-full" />
      </div>
      <div className="esqueleto h-32 rounded-3xl" />
      <div className="esqueleto h-80 rounded-3xl" />
    </div>
  );
}
