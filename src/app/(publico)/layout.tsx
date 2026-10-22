export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-10">
      <p className="mb-8 text-center text-3xl font-black tracking-tight">Saúde Check</p>
      {children}
    </main>
  );
}
