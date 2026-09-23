import { z } from "zod";

export type Plano = "gratuito" | "pago" | "assessoria";

const numero = (valor: string | undefined, padrao: number) => {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : padrao;
};

/** Perguntas por mês de cada plano. Os números vêm do .env; sem eles, 3 e 100. */
export function limiteMensal(plano: Plano, env: Record<string, string | undefined> = process.env) {
  return plano === "gratuito" ? numero(env.LESSY_MAX_GRATUITO, 3) : numero(env.LESSY_MAX_MES_PAGO, 100);
}

/** Teto geral de perguntas por dia, somando todo mundo: protege o orçamento da API. */
export function limiteDiario(env: Record<string, string | undefined> = process.env) {
  return numero(env.LESSY_MAX_DIA, 400);
}

// Brasília não tem mais horário de verão: o fuso é sempre -03:00.
const diaEmBrasilia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // 2026-09-23

/** Meia-noite do dia 1º do mês corrente, em Brasília, como ISO. */
export function inicioDoMes(agora: Date) {
  return new Date(`${diaEmBrasilia(agora).slice(0, 7)}-01T00:00:00-03:00`).toISOString();
}

/** Meia-noite de hoje, em Brasília, como ISO. */
export function inicioDoDia(agora: Date) {
  return new Date(`${diaEmBrasilia(agora)}T00:00:00-03:00`).toISOString();
}

export const esquemaPergunta = z
  .string()
  .trim()
  .min(2, "Escreva sua pergunta.")
  .max(500, "Use até 500 caracteres.");
