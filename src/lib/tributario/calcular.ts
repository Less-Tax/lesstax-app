import {
  FATOR_R_MINIMO,
  INSS_PATRONAL_ANEXO_IV,
  PIS_COFINS_NO_DAS_ANEXO_I,
  SUBLIMITE,
  TABELAS,
  TETO_SIMPLES,
} from "./tabelas";
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

/** Alíquota efetiva = (RBT12 × nominal − parcela a deduzir) ÷ RBT12. */
export function aliquotaEfetiva(rbt12: number, faixas: readonly Faixa[]): number {
  const faixa = faixas.find((f) => rbt12 <= f.limite) ?? faixas[faixas.length - 1];
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
  const acimaDoTeto = rbt12 > TETO_SIMPLES;

  const aliquota = acimaDoTeto ? null : aliquotaEfetiva(rbt12, tabela[anexo]);
  const das = aliquota === null ? 0 : faturamento * aliquota;
  const inssFora = !acimaDoTeto && anexo === "IV" ? folha * INSS_PATRONAL_ANEXO_IV : 0;
  const imposto = das + inssFora;

  const fracaoMono = atividade === "comercio" ? Math.min(Math.max(entrada.monofasico ?? 0, 0), 1) : 0;
  const monofasicoEmDobro =
    !acimaDoTeto && fracaoMono > 0 && rbt12 <= SUBLIMITE
      ? das * fracaoMono * PIS_COFINS_NO_DAS_ANEXO_I
      : 0;

  return {
    regrasVersao: versao,
    rbt12,
    folha12,
    origemRbt12,
    fatorR,
    anexo,
    acimaDoTeto,
    acimaDoSublimite: !acimaDoTeto && rbt12 > SUBLIMITE,
    aliquotaEfetiva: aliquota,
    das: centavos(das),
    inssFora: centavos(inssFora),
    imposto: centavos(imposto),
    monofasicoEmDobro: centavos(monofasicoEmDobro),
    lucro: centavos(faturamento - imposto - folha - custos),
  };
}
