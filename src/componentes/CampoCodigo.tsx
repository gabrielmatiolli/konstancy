"use client";

/**
 * Campo do código de 6 dígitos: teclado numérico, sugestão automática do
 * código (autocomplete="one-time-code" — o iPhone e o teclado do Google
 * oferecem o número do e-mail/SMS) e envio sozinho ao completar.
 */
export function CampoCodigo({ autoFocus = true }: { autoFocus?: boolean }) {
  return (
    <input
      name="codigo"
      aria-label="Código de 6 números"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      required
      autoFocus={autoFocus}
      placeholder="••••••"
      onChange={(e) => {
        const campo = e.currentTarget;
        campo.value = campo.value.replace(/\D/g, "").slice(0, 6);
        if (campo.value.length === 6) campo.form?.requestSubmit();
      }}
      className="campo text-center text-3xl font-extrabold tracking-[0.5em] tabular-nums placeholder:tracking-[0.5em]"
    />
  );
}
