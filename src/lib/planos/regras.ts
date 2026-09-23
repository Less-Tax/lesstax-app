/**
 * Planos: Gratuito e Premium. O que cada um libera fica AQUI, num lugar só —
 * as telas perguntam `ehPremium` e `mesesLiberados`, não repetem a regra.
 * Puro: serve para servidor, telas e testes.
 */
import type { Plano } from "@/lib/lessy/limites";

export type { Plano };

export const PRECO_PREMIUM = "R$ 59,90";

/** Quantos Raio-X (meses mais recentes) o plano gratuito abre. */
export const RELATORIOS_GRATIS = 3;

export const ehPremium = (plano: Plano) => plano === "pago" || plano === "assessoria";

export const nomeDoPlano = (plano: Plano) => (ehPremium(plano) ? "Premium" : "Gratuito");

/**
 * Chaves ("2026-08") dos meses cujo Raio-X o plano abre. `lancados` em ordem
 * do mais antigo para o mais novo. No Premium, todos.
 */
export function mesesLiberados(plano: Plano, lancados: readonly string[]) {
  return new Set(ehPremium(plano) ? lancados : lancados.slice(-RELATORIOS_GRATIS));
}

export type Beneficio = {
  texto: string;
  gratis: string | false;
  premium: string;
  emBreve?: boolean;
};

/** A tabela da tela de planos. `false` = não tem no gratuito. */
export const BENEFICIOS: Beneficio[] = [
  { texto: "Raio-X do imposto de cada mês", gratis: `${RELATORIOS_GRATIS} meses mais recentes`, premium: "Todos os meses, sem limite" },
  { texto: "Lançar meses e calcular o Simples", gratis: "Sim", premium: "Sim" },
  { texto: "Missões e saúde tributária", gratis: "Sim", premium: "Sim" },
  { texto: "Perguntas ao Lessy", gratis: "3 por mês", premium: "50 por mês" },
  { texto: "Dashboard melhorado: evolução mês a mês e comparação com o mês anterior", gratis: false, premium: "Sim" },
  { texto: "Avisos do DAS e das contas a pagar", gratis: false, premium: "Sim", emBreve: true },
  { texto: "Suporte da equipe Less Tax", gratis: false, premium: "Sim" },
  { texto: "Comunidade de empresários", gratis: false, premium: "Sim", emBreve: true },
  { texto: "Newsletter com o que muda nos impostos", gratis: false, premium: "Sim", emBreve: true },
];
