/** Interruptor liga/desliga com a mesma cara em todo sistema (é um checkbox por baixo). */
export function Interruptor({
  name,
  defaultChecked,
  titulo,
  descricao,
}: {
  name: string;
  defaultChecked?: boolean;
  titulo: string;
  descricao?: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-4">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{titulo}</span>
        {descricao && <span className="block text-sm text-suave">{descricao}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-borda transition-colors peer-checked:bg-marca-forte peer-focus-visible:outline-2 peer-focus-visible:outline-marca after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
