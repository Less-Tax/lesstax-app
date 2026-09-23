import {
  FATOR_R_MINIMO,
  INSS_PATRONAL_ANEXO_IV,
  ISS_MAXIMO_FAIXA_5,
  PARTE_ICMS_ISS,
  PIS_COFINS_NO_DAS_ANEXO_I,
  TABELAS,
} from "./tabelas";
import { receitaDoAno } from "./historico";
import { situacaoNoAno } from "./situacao";
import type { Anexo, Atividade, Entrada, Faixa, Historico12, Resultado } from "./tipos";

export const VERSAO_REGRAS = "simples-2026";

/** Arredonda para centavos. Só na saída: as contas intermediárias ficam exatas. */
const centavos = (valor: number) => Math.round(valor * 100) / 100;

const ANEXO_FIXO: Partial<Record<Atividade, Anexo>> = {
  comercio: "I",
  industria: "II",
  servicos: "III",
  obras: "IV",
};

/** Serviços técnicos: Anexo III com Fator R de 28% ou mais, senão Anexo V. */
export function anexoDa(atividade: Atividade, fatorR: number): Anexo {
  return ANEXO_FIXO[atividade] ?? (fatorR >= FATOR_R_MINIMO ? "III" : "V");
}

/** Índice (0 a 5) da faixa da RBT12. Acima de R$ 4,8 mi, a 6ª — o cálculo não para. */
export function faixaDa(rbt12: number, faixas: readonly Faixa[]) {
  const i = faixas.findIndex((f) => rbt12 <= f.limite);
  return i === -1 ? faixas.length - 1 : i;
}

/** Alíquota efetiva = (RBT12 × nominal − parcela a deduzir) ÷ RBT12. */
export function aliquotaEfetiva(rbt12: number, faixas: readonly Faixa[]): number {
  const faixa = faixas[faixaDa(rbt12, faixas)];
  return Math.max(0, (rbt12 * faixa.aliquota - faixa.deduzir) / rbt12);
}

/**
 * Estimativa mensal de impostos no Simples Nacional.
 * Função pura: não lê banco, não faz rede, não depende de tela.
 *
 * A faixa da tabela e o Fator R dependem dos 12 meses ANTERIORES. Passe o
 * `historico` (veja `historico12`); sem ele, o próprio mês × 12 é a estimativa.
 */
export function calcular(entrada: Entrada, versao: string = VERSAO_REGRAS, historico?: Historico12): Resultado {
  const tabela = TABELAS[versao];
  if (!tabela) throw new Error(`Versão de regras desconhecida: ${versao}`);

  const { atividade, faturamento, folha, custos } = entrada;
  if (!(faturamento > 0)) throw new RangeError("O faturamento precisa ser maior que zero.");
  if (folha < 0 || custos < 0) throw new RangeError("Folha e custos não podem ser negativos.");

  const rbt12 = historico?.rbt12 ?? faturamento * 12;
  const folha12 = historico?.folha12 ?? folha * 12;
  const origemRbt12 = historico?.origem ?? { tipo: "mes" as const, meses: 0 };
  if (!(rbt12 > 0)) throw new RangeError("A receita de 12 meses precisa ser maior que zero.");
  const fatorR = folha12 / rbt12;
  const anexo = anexoDa(atividade, fatorR);

  // RBT12 decide só a faixa e a alíquota. Acima de R$ 4,8 mi, 6ª faixa.
  const i = faixaDa(rbt12, tabela[anexo]);
  const aliquota = aliquotaEfetiva(rbt12, tabela[anexo]);
  const dasCheio = faturamento * aliquota;

  // A receita do ANO decide sublimite, teto e permanência no Simples.
  // Sem histórico, o mês vale sozinho (como um janeiro): só ele conta no ano.
  const receitaAno = historico?.ano ?? receitaDoAno([], { ano: 0, mes: 1, faturamento, folha });
  const situacao = situacaoNoAno(receitaAno);

  // ICMS/ISS fora do DAS: tira a parte deles (pela repartição da faixa).
  let parteIcmsIss = aliquota * PARTE_ICMS_ISS[anexo][i];
  if ((anexo === "III" || anexo === "IV") && i === 4) parteIcmsIss = Math.min(parteIcmsIss, ISS_MAXIMO_FAIXA_5);
  const icmsIssFora = !situacao.icmsIssNoDas;
  const das = icmsIssFora ? dasCheio - faturamento * parteIcmsIss : dasCheio;

  const inssFora = anexo === "IV" ? folha * INSS_PATRONAL_ANEXO_IV : 0;
  const imposto = das + inssFora;

  // PIS/Cofins são 15,5% do DAS do Anexo I nas faixas 1 a 5.
  const fracaoMono = atividade === "comercio" ? Math.min(Math.max(entrada.monofasico ?? 0, 0), 1) : 0;
  const monofasicoEmDobro = fracaoMono > 0 && i <= 4 ? dasCheio * fracaoMono * PIS_COFINS_NO_DAS_ANEXO_I : 0;

  return {
    regrasVersao: versao,
    rbt12,
    folha12,
    origemRbt12,
    fatorR,
    anexo,
    faixa: i + 1,
    foraDoSimples: !situacao.noSimples,
    icmsIssFora,
    situacao,
    aliquotaEfetiva: aliquota,
    das: centavos(das),
    inssFora: centavos(inssFora),
    imposto: centavos(imposto),
    monofasicoEmDobro: centavos(monofasicoEmDobro),
    lucro: centavos(faturamento - imposto - folha - custos),
  };
}
