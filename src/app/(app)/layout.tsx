import { exigirFamilia } from "@/lib/familia";
import { NavInferior } from "@/componentes/NavInferior";

/** Todas as telas logadas: exige família e reserva espaço para a navegação inferior. */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await exigirFamilia();
  return (
    <>
      <main className="mx-auto w-full max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(var(--altura-nav)+env(safe-area-inset-bottom)+1.5rem)]">
        {children}
      </main>
      <NavInferior />
    </>
  );
}
