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

/**
 * De onde veio a receita de 12 meses (RBT12):
 * - historico: soma dos 12 meses anteriores, todos lançados — é a conta da Receita
 * - media: média dos meses anteriores lançados × 12 (histórico incompleto)
 * - mes: o próprio mês × 12 (nenhum mês anterior lançado)
 */
export type OrigemRbt12 = { tipo: "historico" | "media" | "mes"; meses: number };

/** Receita e folha dos 12 meses anteriores, já apuradas a partir do histórico. */
export type Historico12 = { rbt12: number; folha12: number; origem: OrigemRbt12 };

export type Resultado = {
  regrasVersao: string;
  /** Receita bruta dos 12 meses anteriores (RBT12). Define a faixa da tabela. */
  rbt12: number;
  /** Salários e pró-labore dos 12 meses anteriores. */
  folha12: number;
  origemRbt12: OrigemRbt12;
  /** Folha de 12 meses ÷ receita de 12 meses. */
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
