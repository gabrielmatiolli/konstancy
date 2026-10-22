/** Retorno padrão das Server Actions usadas com useActionState. */
export interface EstadoDoForm {
  erro?: string;
  ok?: boolean;
}

export const estadoInicial: EstadoDoForm = {};
