/**
 * Cálculo do Simples Nacional.
 *
 * Regra do projeto: este módulo não importa nada de fora dele — nem React,
 * nem banco, nem fetch. É o que o torna testável e reaproveitável no app mobile.
 */
export { calcular, anexoDa, aliquotaEfetiva, faixaDa, VERSAO_REGRAS } from "./calcular";
export { situacaoNoAno } from "./situacao";
export { TABELAS, TETO_SIMPLES, SUBLIMITE, FATOR_R_MINIMO, PATAMARES } from "./tabelas";
export type { Atividade, Anexo, Entrada, Resultado, Faixa } from "./tipos";
export { oportunidades, manchete, rotuloRegime, PRAZO_REFORMA } from "./oportunidades";
export type { Cartao, Tom, Contexto } from "./oportunidades";
export { reais, porcento } from "./formato";
export { historico12, mesesQueFaltam, receitaDoAno } from "./historico";
export type { MesLancado } from "./historico";
export type { Historico12, OrigemRbt12, Aviso, Situacao, ReceitaAno } from "./tipos";
