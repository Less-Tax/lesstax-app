import type { Historico12 } from "./tipos";

/** Um mês lançado, só com o que a conta de 12 meses precisa. */
export type MesLancado = { ano: number; mes: number; faturamento: number; folha: number };

const indice = (c: { ano: number; mes: number }) => c.ano * 12 + (c.mes - 1);

/**
 * Receita e folha dos 12 meses ANTERIORES ao mês calculado (a RBT12 da lei).
 *
 * - Os 12 lançados: soma exata.
 * - Parte deles: média dos lançados × 12. É também a regra da lei para empresa
 *   com menos de 12 meses (LC 123, art. 18, § 2º).
 * - Nenhum anterior: o próprio mês × 12 (regra do primeiro mês de atividade).
 */
export function historico12(
  meses: readonly MesLancado[],
  alvo: MesLancado,
): Historico12 {
  const fim = indice(alvo);
  const anteriores = meses.filter((m) => {
    const i = indice(m);
    return i >= fim - 12 && i < fim;
  });

  if (anteriores.length === 0) {
    return { rbt12: alvo.faturamento * 12, folha12: alvo.folha * 12, origem: { tipo: "mes", meses: 0 } };
  }

  const receita = anteriores.reduce((s, m) => s + m.faturamento, 0);
  const folha = anteriores.reduce((s, m) => s + m.folha, 0);

  if (anteriores.length === 12) {
    return { rbt12: receita, folha12: folha, origem: { tipo: "historico", meses: 12 } };
  }

  const n = anteriores.length;
  return {
    rbt12: (receita / n) * 12,
    folha12: (folha / n) * 12,
    origem: { tipo: "media", meses: n },
  };
}

/** Meses dos 12 anteriores que ainda não foram lançados, do mais recente ao mais antigo. */
export function mesesQueFaltam(meses: readonly MesLancado[], alvo: { ano: number; mes: number }) {
  const lancados = new Set(meses.map(indice));
  const fim = indice(alvo);
  const faltam: { ano: number; mes: number }[] = [];
  for (let i = fim - 1; i >= fim - 12; i--) {
    if (!lancados.has(i)) faltam.push({ ano: Math.floor(i / 12), mes: (i % 12) + 1 });
  }
  return faltam;
}
