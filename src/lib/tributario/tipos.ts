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

/**
 * Receita do ano-calendário (RBA): é ela, e não a RBT12, que decide sublimite,
 * teto e permanência no Simples.
 */
export type ReceitaAno = {
  ano: number;
  mes: number;
  /** Janeiro até o mês calculado, inclusive. */
  rba: number;
  /** Janeiro até o mês anterior. Efeitos "a partir do mês seguinte" olham para ela. */
  rbaAteMesAnterior: number;
  /** Ano anterior inteiro (só o que foi lançado). null = nenhum mês lançado. */
  rbaAnoAnterior: number | null;
  /** Primeiro mês do ano em que a RBA passou de cada marco. */
  excessos: Partial<Record<Patamar, number>>;
  /** Meses de janeiro até o calculado que não foram lançados (a RBA pode estar baixa). */
  mesesSemLancamento: number;
};

export type Patamar = "sublimite" | "sublimiteMais20" | "teto" | "tetoMais20";

/** Receita e folha dos 12 meses anteriores, já apuradas a partir do histórico. */
export type Historico12 = { rbt12: number; folha12: number; origem: OrigemRbt12; ano?: ReceitaAno };

export type Aviso = {
  id: string;
  /** alerta: algo mudou ou vai mudar com prazo; atencao: chegando perto de um marco. */
  nivel: "alerta" | "atencao";
  titulo: string;
  texto: string;
};

/** Onde a empresa está neste mês em relação aos marcos do Simples. */
export type Situacao = {
  /** false = já excluída do Simples neste mês (o cálculo fica como referência). */
  noSimples: boolean;
  /** false = ICMS/ISS pagos fora do DAS neste mês (não somados). */
  icmsIssNoDas: boolean;
  receitaAno: ReceitaAno;
  avisos: Aviso[];
};

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
  /** Faixa da tabela (1 a 6) pela RBT12. Acima de R$ 4,8 mi de RBT12, a 6ª. */
  faixa: number;
  /**
   * true quando a empresa já está excluída do Simples neste mês, pela receita do
   * ano (não pela RBT12). O imposto continua calculado, como referência.
   */
  foraDoSimples: boolean;
  /** true quando ICMS/ISS estão fora do DAS neste mês — e NÃO estão em `imposto`. */
  icmsIssFora: boolean;
  situacao: Situacao;
  /** Alíquota efetiva. Simulações antigas podem ter null. */
  aliquotaEfetiva: number | null;
  das: number;
  /** INSS patronal pago fora do DAS (só Anexo IV). */
  inssFora: number;
  imposto: number;
  /** Estimativa de PIS/Cofins pagos em dobro em produtos monofásicos, por mês. */
  monofasicoEmDobro: number;
  lucro: number;
};
