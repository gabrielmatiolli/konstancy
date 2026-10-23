/**
 * Celular brasileiro: aceita do jeito que a pessoa digitar — "(11) 98765-4321",
 * "11987654321", "+55 11 98765 4321", "011..." — e guarda em E.164
 * ("+5511987654321"), o formato que provedores de SMS esperam no futuro.
 */

/** Devolve o número em E.164 ou null se não for um celular brasileiro válido. */
export function normalizarTelefone(bruto: string): string | null {
  let digitos = bruto.replace(/\D/g, "");
  if (digitos.startsWith("0")) digitos = digitos.replace(/^0+/, ""); // 0 de longa distância
  if (digitos.length === 13 && digitos.startsWith("55")) digitos = digitos.slice(2);
  if (digitos.length !== 11) return null;

  const ddd = Number(digitos.slice(0, 2));
  // DDDs brasileiros vão de 11 a 99 e nenhum termina em 0; celular começa com 9.
  if (ddd < 11 || ddd % 10 === 0 || digitos[2] !== "9") return null;
  return `+55${digitos}`;
}

/** "+5511987654321" → "(11) 98765-4321" */
export function formatarTelefone(e164: string) {
  const d = e164.replace(/^\+55/, "");
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Campo de login aceita e-mail ou celular: decide pelo "@". */
export function ehEmail(identificador: string) {
  return identificador.includes("@");
}
