/** O que a empresa faz. Define o anexo do Simples (serviços técnicos dependem do Fator R). */
export type Atividade = "comercio" | "industria" | "servicos" | "profissionais" | "obras";

export type Anexo = "I" | "II" | "III" | "IV" | "V";

/** Uma faixa da tabela do Simples: até `limite` de receita em 12 meses. */
export type Faixa = {
  limite: number;
  aliquota: number;
  deduzir: number;
};

export type TabelaSimples = Record<Anexo, readonly Faixa[]>;

/** Números de um mês comum da empresa, em reais. */
export type Entrada = {
  atividade: Atividade;
  faturamento: number;
  folha: number;
  custos: number;
  /** Fração das vendas em produtos monofásicos (0 a 1). Só vale para comércio. */
  monofasico?: number;
};

export type Resultado = {
  regrasVersao: string;
  /** Receita bruta estimada em 12 meses. */
  rbt12: number;
  /** Folha ÷ faturamento. */
  fatorR: number;
  anexo: Anexo;
  /** true quando a receita anual passa do teto do Simples (R$ 4,8 milhões). */
  acimaDoTeto: boolean;
  /**
   * true entre R$ 3,6 e 4,8 milhões por ano. Nessa faixa o ICMS e o ISS saem do
   * DAS e são pagos à parte — e NÃO estão incluídos em `imposto`.
   */
  acimaDoSublimite: boolean;
  /** Alíquota efetiva. null acima do teto, onde o Simples não se aplica. */
  aliquotaEfetiva: number | null;
  das: number;
  /** INSS patronal pago fora do DAS (só Anexo IV). */
  inssFora: number;
  imposto: number;
  /** Estimativa de PIS/Cofins pagos em dobro em produtos monofásicos, por mês. */
  monofasicoEmDobro: number;
  lucro: number;
};
