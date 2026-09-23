import type { TabelaSimples } from "./tipos";

/**
 * Tabelas do Simples Nacional (LC 123/2006, anexos I a V).
 * Versionadas por vigência: quando a lei mudar, entra uma versão nova aqui e
 * as simulações antigas continuam apontando para a versão com que foram feitas.
 */
export const TABELAS: Record<string, TabelaSimples> = {
  "simples-2026": {
    I: [
      { limite: 180_000, aliquota: 0.04, deduzir: 0 },
      { limite: 360_000, aliquota: 0.073, deduzir: 5_940 },
      { limite: 720_000, aliquota: 0.095, deduzir: 13_860 },
      { limite: 1_800_000, aliquota: 0.107, deduzir: 22_500 },
      { limite: 3_600_000, aliquota: 0.143, deduzir: 87_300 },
      { limite: 4_800_000, aliquota: 0.19, deduzir: 378_000 },
    ],
    II: [
      { limite: 180_000, aliquota: 0.045, deduzir: 0 },
      { limite: 360_000, aliquota: 0.078, deduzir: 5_940 },
      { limite: 720_000, aliquota: 0.1, deduzir: 13_860 },
      { limite: 1_800_000, aliquota: 0.112, deduzir: 22_500 },
      { limite: 3_600_000, aliquota: 0.147, deduzir: 85_500 },
      { limite: 4_800_000, aliquota: 0.3, deduzir: 720_000 },
    ],
    III: [
      { limite: 180_000, aliquota: 0.06, deduzir: 0 },
      { limite: 360_000, aliquota: 0.112, deduzir: 9_360 },
      { limite: 720_000, aliquota: 0.135, deduzir: 17_640 },
      { limite: 1_800_000, aliquota: 0.16, deduzir: 35_640 },
      { limite: 3_600_000, aliquota: 0.21, deduzir: 125_640 },
      { limite: 4_800_000, aliquota: 0.33, deduzir: 648_000 },
    ],
    IV: [
      { limite: 180_000, aliquota: 0.045, deduzir: 0 },
      { limite: 360_000, aliquota: 0.09, deduzir: 8_100 },
      { limite: 720_000, aliquota: 0.102, deduzir: 12_420 },
      { limite: 1_800_000, aliquota: 0.14, deduzir: 39_780 },
      { limite: 3_600_000, aliquota: 0.22, deduzir: 183_780 },
      { limite: 4_800_000, aliquota: 0.33, deduzir: 828_000 },
    ],
    V: [
      { limite: 180_000, aliquota: 0.155, deduzir: 0 },
      { limite: 360_000, aliquota: 0.18, deduzir: 4_500 },
      { limite: 720_000, aliquota: 0.195, deduzir: 9_900 },
      { limite: 1_800_000, aliquota: 0.205, deduzir: 17_100 },
      { limite: 3_600_000, aliquota: 0.23, deduzir: 62_100 },
      { limite: 4_800_000, aliquota: 0.305, deduzir: 540_000 },
    ],
  },
};

/** Teto de receita anual do Simples Nacional. */
export const TETO_SIMPLES = 4_800_000;

/** Acima deste valor, parte dos impostos (ICMS/ISS) sai do DAS — sublimite. */
export const SUBLIMITE = 3_600_000;

/** Fator R mínimo para serviços técnicos irem para o Anexo III. */
export const FATOR_R_MINIMO = 0.28;

/** INSS patronal do Anexo IV, pago fora do DAS. */
export const INSS_PATRONAL_ANEXO_IV = 0.2;

/** Parte do DAS do Anexo I que corresponde a PIS + Cofins (faixas 1 a 5). */
export const PIS_COFINS_NO_DAS_ANEXO_I = 0.155;

/**
 * Parte do DAS que é ICMS (Anexos I e II) ou ISS (III, IV e V), por faixa.
 * Serve só para tirar essa parte do DAS quando ela passa a ser paga à parte
 * (sublimite). Na 6ª faixa a lei já não põe ICMS/ISS no DAS: 0.
 * Fonte: percentuais de repartição dos Anexos I a V (LC 155/2016).
 */
export const PARTE_ICMS_ISS: Record<"I" | "II" | "III" | "IV" | "V", readonly number[]> = {
  I: [0.34, 0.34, 0.335, 0.335, 0.335, 0],
  II: [0.32, 0.32, 0.32, 0.32, 0.32, 0],
  III: [0.335, 0.32, 0.325, 0.325, 0.335, 0],
  IV: [0.445, 0.4, 0.4, 0.4, 0.4, 0],
  V: [0.14, 0.17, 0.19, 0.21, 0.235, 0],
};

/** Nota dos Anexos III e IV, 5ª faixa: o ISS efetivo não passa de 5% da receita. */
export const ISS_MAXIMO_FAIXA_5 = 0.05;

/**
 * Os quatro marcos, medidos pela receita do ANO-CALENDÁRIO (RBA), não pela RBT12.
 * LC 123: art. 3º, II, §§ 9º e 9º-A (teto e tolerância de 20%); art. 13-A e
 * art. 20 (sublimite e a mesma tolerância).
 */
export const PATAMARES = {
  sublimite: 3_600_000,
  sublimiteMais20: 4_320_000,
  teto: 4_800_000,
  tetoMais20: 5_760_000,
} as const;

/** Alerta quando a receita do ano chega a esta fração de um marco. */
export const ALERTA_PATAMAR = 0.8;
