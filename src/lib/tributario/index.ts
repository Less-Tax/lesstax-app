/**
 * Cálculo do Simples Nacional.
 *
 * Regra do projeto: este módulo não importa nada — nem React, nem banco,
 * nem fetch. É o que o torna testável e reaproveitável no app de celular.
 *
 * A portar do MVP (MVP/api/_simples.js), com testes:
 *   - tabelas dos anexos I a V, versionadas por ano de vigência
 *   - alíquota efetiva e DAS
 *   - Fator R (Anexo III x V)
 *   - INSS patronal do Anexo IV
 *   - monofásicos
 *   - caso acima do teto (RBT12 > 4.800.000)
 */
export const VERSAO_REGRAS = "simples-2026";
