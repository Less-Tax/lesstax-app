import { PATAMARES } from "./tabelas";
import type { Historico12, Patamar, ReceitaAno } from "./tipos";

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

  const ano = receitaDoAno(meses, alvo);

  if (anteriores.length === 0) {
    return { rbt12: alvo.faturamento * 12, folha12: alvo.folha * 12, origem: { tipo: "mes", meses: 0 }, ano };
  }

  const receita = anteriores.reduce((s, m) => s + m.faturamento, 0);
  const folha = anteriores.reduce((s, m) => s + m.folha, 0);

  if (anteriores.length === 12) {
    return { rbt12: receita, folha12: folha, origem: { tipo: "historico", meses: 12 }, ano };
  }

  const n = anteriores.length;
  return {
    rbt12: (receita / n) * 12,
    folha12: (folha / n) * 12,
    origem: { tipo: "media", meses: n },
    ano,
  };
}

/**
 * Receita do ano-calendário do mês calculado (RBA), de janeiro até ele, e o
 * total do ano anterior. O mês calculado entra pelo valor de `alvo` (pode
 * ainda não estar salvo). Mês não lançado conta como zero.
 */
export function receitaDoAno(meses: readonly MesLancado[], alvo: MesLancado): ReceitaAno {
  const doAno = new Map<number, number>();
  let anoAnterior = 0;
  let lancadosAnoAnterior = 0;
  for (const m of meses) {
    if (m.ano === alvo.ano && m.mes < alvo.mes) doAno.set(m.mes, m.faturamento);
    if (m.ano === alvo.ano - 1) {
      anoAnterior += m.faturamento;
      lancadosAnoAnterior++;
    }
  }
  doAno.set(alvo.mes, alvo.faturamento);

  const excessos: Partial<Record<Patamar, number>> = {};
  let acumulado = 0;
  let rbaAteMesAnterior = 0;
  for (let mes = 1; mes <= alvo.mes; mes++) {
    if (mes === alvo.mes) rbaAteMesAnterior = acumulado;
    acumulado += doAno.get(mes) ?? 0;
    for (const [nome, valor] of Object.entries(PATAMARES) as [Patamar, number][]) {
      if (excessos[nome] === undefined && acumulado > valor) excessos[nome] = mes;
    }
  }

  return {
    ano: alvo.ano,
    mes: alvo.mes,
    rba: acumulado,
    rbaAteMesAnterior,
    rbaAnoAnterior: lancadosAnoAnterior > 0 ? anoAnterior : null,
    excessos,
    mesesSemLancamento: alvo.mes - doAno.size,
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
