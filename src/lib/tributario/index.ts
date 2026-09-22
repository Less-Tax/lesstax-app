/**
 * Cálculo do Simples Nacional.
 *
 * Regra do projeto: este módulo não importa nada de fora dele — nem React,
 * nem banco, nem fetch. É o que o torna testável e reaproveitável no app mobile.
 */
export { calcular, anexoDa, aliquotaEfetiva, VERSAO_REGRAS } from "./calcular";
export { TABELAS, TETO_SIMPLES, SUBLIMITE, FATOR_R_MINIMO } from "./tabelas";
export type { Atividade, Anexo, Entrada, Resultado, Faixa } from "./tipos";
