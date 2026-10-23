import { Marca } from "@/componentes/Marca";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Marca />
        <p className="mt-4 text-[32px] leading-none font-light tracking-[0.01em]">konstancy</p>
        <p className="text-suave">A família treinando junto, um dia de cada vez.</p>
      </div>
      {children}
    </main>
  );
}
