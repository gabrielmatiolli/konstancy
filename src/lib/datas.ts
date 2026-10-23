/**
 * Datas civis ("dias") no fuso da família.
 *
 * O servidor (Vercel) roda em UTC: às 22h de Itatiba já é amanhã lá. Todo
 * check-in grava o dia civil de São Paulo numa coluna DATE, e as contas de
 * desafio/painel trabalham com strings "AAAA-MM-DD" para não misturar fusos.
 */

export const FUSO = "America/Sao_Paulo";

/** "AAAA-MM-DD" do instante informado, no fuso da família. */
export function diaDe(instante: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
}

export function hoje(): string {
  return diaDe();
}

/** Converte "AAAA-MM-DD" para o Date que o Prisma espera numa coluna @db.Date. */
export function paraDate(dia: string): Date {
  return new Date(`${dia}T00:00:00.000Z`);
}

/** Converte o Date lido de uma coluna @db.Date de volta para "AAAA-MM-DD". */
export function deDate(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function somarDias(dia: string, n: number): string {
  const d = paraDate(dia);
  d.setUTCDate(d.getUTCDate() + n);
  return deDate(d);
}

/** Lista inclusiva de dias entre `inicio` e `fim`. */
export function diasEntre(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

export function diferencaEmDias(de: string, ate: string): number {
  return Math.round((paraDate(ate).getTime() - paraDate(de).getTime()) / 86_400_000);
}

const formatoCurto = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const formatoSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const formatoLongo = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const formatoHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });

/** "21/10" */
export function rotuloCurto(dia: string): string {
  return formatoCurto.format(paraDate(dia));
}

/** "ter" */
export function rotuloSemana(dia: string): string {
  return formatoSemana.format(paraDate(dia)).replace(".", "");
}

/** "Hoje", "Ontem" ou "terça-feira, 21 de outubro". */
export function rotuloDia(dia: string): string {
  const h = hoje();
  if (dia === h) return "Hoje";
  if (dia === somarDias(h, -1)) return "Ontem";
  return formatoLongo.format(paraDate(dia));
}

/** "07:42", no fuso da família. */
export function hora(instante: Date): string {
  return formatoHora.format(instante);
}

/** "há 5 min", "há 2 h", ou a hora quando já passou de um dia. */
export function tempoRelativo(instante: Date): string {
  const seg = Math.round((Date.now() - instante.getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `${rotuloCurto(diaDe(instante))} ${hora(instante)}`;
}

/** Segunda-feira da semana do dia (a semana da grade vai de segunda a domingo). */
export function inicioDaSemana(dia: string): string {
  const diaDaSemana = paraDate(dia).getUTCDay(); // 0 = domingo
  return somarDias(dia, -((diaDaSemana + 6) % 7));
}

const formatoDiaLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const formatoMes = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

/** "SEXTA · 23 OUT" — rótulo do topo do início. */
export function rotuloDataCurta(dia: string): string {
  const d = paraDate(dia);
  const semana = formatoDiaLongo.format(d).split("-")[0];
  const mes = formatoMes.format(d).replace(".", "");
  return `${semana} · ${d.getUTCDate()} ${mes}`.toUpperCase();
}

/** "S" — inicial do dia da semana, para o cabeçalho da grade. */
export function inicialDaSemana(dia: string): string {
  return rotuloSemana(dia).charAt(0).toUpperCase();
}
