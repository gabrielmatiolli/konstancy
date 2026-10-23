/** Campos para mostrar alguém (nome + foto). Use em todo `select` que alimenta um <Avatar>. */
export const selecaoPessoa = { id: true, nome: true, avatarVersao: true } as const;

export interface Pessoa {
  id: string;
  nome: string;
  avatarVersao: number;
}
