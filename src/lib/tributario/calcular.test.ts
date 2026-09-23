import { describe, expect, it } from "vitest";
import { aliquotaEfetiva, anexoDa, calcular, TABELAS, VERSAO_REGRAS } from "./index";
import type { Anexo } from "./index";

// Os valores esperados foram calculados à mão a partir das tabelas da
// LC 123/2006 e conferem com o que o MVP em HTML mostrava.

describe("anexo", () => {
  it("atividades com anexo fixo", () => {
    expect(anexoDa("comercio", 0)).toBe("I");
    expect(anexoDa("industria", 0)).toBe("II");
    expect(anexoDa("servicos", 0)).toBe("III");
    expect(anexoDa("obras", 0)).toBe("IV");
  });

  it("serviço técnico com folha abaixo de 28% vai para o Anexo V", () => {
    expect(anexoDa("profissionais", 0.2)).toBe("V");
  });

  it("serviço técnico com folha de 28% ou mais vai para o Anexo III", () => {
    expect(anexoDa("profissionais", 0.28)).toBe("III");
    expect(anexoDa("profissionais", 0.5)).toBe("III");
  });

  it("28% exatos, vindos de uma divisão, também contam como Anexo III", () => {
    const r = calcular({ atividade: "profissionais", faturamento: 50_000, folha: 14_000, custos: 0 });
    expect(r.anexo).toBe("III");
  });
});

describe("casos completos", () => {
  it("empresa de exemplo do MVP: serviço técnico no Anexo V", () => {
    const r = calcular({ atividade: "profissionais", faturamento: 60_000, folha: 12_000, custos: 20_000 });
    expect(r.rbt12).toBe(720_000);
    expect(r.fatorR).toBeCloseTo(0.2);
    expect(r.anexo).toBe("V");
    expect(r.aliquotaEfetiva).toBeCloseTo(0.18125);
    expect(r.das).toBe(10_875);
    expect(r.imposto).toBe(10_875);
    expect(r.lucro).toBe(17_125);
  });

  it("a mesma empresa com Fator R a favor cai para o Anexo III e paga menos", () => {
    const r = calcular({ atividade: "profissionais", faturamento: 60_000, folha: 18_000, custos: 20_000 });
    expect(r.anexo).toBe("III");
    expect(r.aliquotaEfetiva).toBeCloseTo(0.1105);
    expect(r.das).toBe(6_630);
    expect(r.lucro).toBe(15_370);
  });

  it("comércio na primeira faixa paga a alíquota nominal", () => {
    const r = calcular({ atividade: "comercio", faturamento: 10_000, folha: 0, custos: 0 });
    expect(r.aliquotaEfetiva).toBeCloseTo(0.04);
    expect(r.das).toBe(400);
  });

  it("obras pagam INSS patronal fora do DAS", () => {
    const r = calcular({ atividade: "obras", faturamento: 50_000, folha: 15_000, custos: 10_000 });
    expect(r.anexo).toBe("IV");
    expect(r.aliquotaEfetiva).toBeCloseTo(0.0813);
    expect(r.das).toBe(4_065);
    expect(r.inssFora).toBe(3_000);
    expect(r.imposto).toBe(7_065);
    expect(r.lucro).toBe(17_935);
  });

  it("serviços que não são obras não têm INSS fora do DAS", () => {
    const r = calcular({ atividade: "servicos", faturamento: 50_000, folha: 15_000, custos: 0 });
    expect(r.inssFora).toBe(0);
  });
});

describe("monofásicos", () => {
  it("estima o PIS/Cofins pago em dobro", () => {
    const r = calcular({ atividade: "comercio", faturamento: 100_000, folha: 0, custos: 0, monofasico: 0.5 });
    expect(r.aliquotaEfetiva).toBeCloseTo(0.08825);
    expect(r.das).toBe(8_825);
    expect(r.monofasicoEmDobro).toBe(683.94);
  });

  it("não se aplica acima do sublimite de R$ 3,6 milhões", () => {
    const r = calcular({ atividade: "comercio", faturamento: 350_000, folha: 0, custos: 0, monofasico: 0.5 });
    expect(r.monofasicoEmDobro).toBe(0);
  });

  it("é ignorado fora do comércio", () => {
    const r = calcular({ atividade: "servicos", faturamento: 100_000, folha: 0, custos: 0, monofasico: 0.5 });
    expect(r.monofasicoEmDobro).toBe(0);
  });

  it("fração fora de 0 a 1 é limitada", () => {
    const acima = calcular({ atividade: "comercio", faturamento: 100_000, folha: 0, custos: 0, monofasico: 7 });
    const cheio = calcular({ atividade: "comercio", faturamento: 100_000, folha: 0, custos: 0, monofasico: 1 });
    expect(acima.monofasicoEmDobro).toBe(cheio.monofasicoEmDobro);
  });
});

describe("RBT12 só decide a faixa", () => {
  it("exatamente R$ 4,8 milhões de RBT12 fica na 6ª faixa", () => {
    const r = calcular({ atividade: "comercio", faturamento: 400_000, folha: 0, custos: 0 });
    expect(r.faixa).toBe(6);
    expect(r.aliquotaEfetiva).toBeCloseTo(0.11125);
    expect(r.das).toBe(44_500);
  });

  it("RBT12 acima de R$ 4,8 milhões NÃO bloqueia: usa a 6ª faixa", () => {
    const r = calcular({ atividade: "comercio", faturamento: 500_000, folha: 100_000, custos: 200_000 });
    expect(r.faixa).toBe(6);
    // (6.000.000 × 19% − 378.000) ÷ 6.000.000 = 12,7%
    expect(r.aliquotaEfetiva).toBeCloseTo(0.127);
    expect(r.das).toBe(63_500);
    expect(r.foraDoSimples).toBe(false); // sem histórico, o ano só tem este mês
  });
});

describe("integridade das tabelas", () => {
  const anexos: Anexo[] = ["I", "II", "III", "IV", "V"];
  const tabela = TABELAS[VERSAO_REGRAS];

  // A lei monta as tabelas para a alíquota efetiva não saltar na virada de uma
  // faixa para a outra. Um erro de digitação numa parcela a deduzir quebra isso.
  it.each(anexos)("Anexo %s não salta nas viradas até R$ 1,8 milhão", (anexo) => {
    const faixas = tabela[anexo];
    for (let i = 0; i < 4; i++) {
      const limite = faixas[i].limite;
      const nestaFaixa = (limite * faixas[i].aliquota - faixas[i].deduzir) / limite;
      const naProxima = (limite * faixas[i + 1].aliquota - faixas[i + 1].deduzir) / limite;
      expect(naProxima).toBeCloseTo(nestaFaixa, 10);
    }
  });

  // Na 6ª faixa o ICMS/ISS sai do DAS, então a alíquota CAI em R$ 3,6 milhões.
  // Não é erro de digitação: está na lei. Este teste existe para ninguém
  // "corrigir" a tabela achando que é.
  it.each(anexos)("Anexo %s cai de propósito na virada de R$ 3,6 milhões", (anexo) => {
    const faixas = tabela[anexo];
    expect(aliquotaEfetiva(3_600_001, faixas)).toBeLessThan(aliquotaEfetiva(3_600_000, faixas));
  });
});

describe("entradas inválidas", () => {
  it("recusa faturamento zero ou negativo", () => {
    expect(() => calcular({ atividade: "comercio", faturamento: 0, folha: 0, custos: 0 })).toThrow(RangeError);
    expect(() => calcular({ atividade: "comercio", faturamento: -1, folha: 0, custos: 0 })).toThrow(RangeError);
  });

  it("recusa folha ou custos negativos", () => {
    expect(() => calcular({ atividade: "comercio", faturamento: 1_000, folha: -1, custos: 0 })).toThrow(RangeError);
    expect(() => calcular({ atividade: "comercio", faturamento: 1_000, folha: 0, custos: -1 })).toThrow(RangeError);
  });

  it("recusa versão de regras que não existe", () => {
    expect(() => calcular({ atividade: "comercio", faturamento: 1_000, folha: 0, custos: 0 }, "simples-1999")).toThrow();
  });

  it("registra a versão usada no resultado", () => {
    const r = calcular({ atividade: "comercio", faturamento: 1_000, folha: 0, custos: 0 });
    expect(r.regrasVersao).toBe("simples-2026");
  });
});
