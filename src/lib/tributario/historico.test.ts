import { describe, expect, it } from "vitest";
import { calcular, historico12, mesesQueFaltam, type MesLancado } from "./index";

// Loja do exemplo: R$ 20 mil por mês e R$ 80 mil em dezembro.
const ano = (a: number): MesLancado[] =>
  Array.from({ length: 12 }, (_, i) => ({ ano: a, mes: i + 1, faturamento: i === 11 ? 80_000 : 20_000, folha: 4_000 }));

describe("historico12", () => {
  const meses = [...ano(2025), ...ano(2026)];
  const dezembro = meses.find((m) => m.ano === 2026 && m.mes === 12)!;

  it("soma os 12 meses ANTERIORES — o próprio mês fica de fora", () => {
    const h = historico12(meses, dezembro);
    // dez/2025 (80 mil) + jan a nov/2026 (11 × 20 mil)
    expect(h.rbt12).toBe(300_000);
    expect(h.folha12).toBe(48_000);
    expect(h.origem).toEqual({ tipo: "historico", meses: 12 });
  });

  it("dezembro com o histórico real paga bem menos que a estimativa × 12", () => {
    const entrada = { atividade: "comercio" as const, faturamento: 80_000, folha: 4_000, custos: 0 };
    const estimado = calcular(entrada);
    const real = calcular(entrada, undefined, historico12(meses, dezembro));
    expect(estimado.rbt12).toBe(960_000);
    expect(estimado.das).toBe(6_685);
    expect(real.rbt12).toBe(300_000);
    expect(real.das).toBe(4_256);
    expect(real.origemRbt12.tipo).toBe("historico");
  });

  it("com parte dos meses, usa a média dos lançados × 12", () => {
    const tres: MesLancado[] = [
      { ano: 2026, mes: 6, faturamento: 10_000, folha: 1_000 },
      { ano: 2026, mes: 7, faturamento: 20_000, folha: 2_000 },
      { ano: 2026, mes: 8, faturamento: 30_000, folha: 3_000 },
    ];
    const h = historico12(tres, { ano: 2026, mes: 9, faturamento: 99_999, folha: 0 });
    expect(h.rbt12).toBe(240_000); // média 20 mil × 12
    expect(h.folha12).toBe(24_000);
    expect(h.origem).toEqual({ tipo: "media", meses: 3 });
  });

  it("sem nenhum mês anterior, usa o próprio mês × 12", () => {
    const h = historico12([], { ano: 2026, mes: 9, faturamento: 15_000, folha: 3_000 });
    expect(h).toEqual({ rbt12: 180_000, folha12: 36_000, origem: { tipo: "mes", meses: 0 } });
  });

  it("ignora meses de mais de 12 meses atrás e meses depois do calculado", () => {
    const soltos: MesLancado[] = [
      { ano: 2025, mes: 8, faturamento: 1_000_000, folha: 0 }, // 13 meses antes: fora
      { ano: 2026, mes: 10, faturamento: 1_000_000, folha: 0 }, // depois: fora
      { ano: 2026, mes: 8, faturamento: 12_000, folha: 0 },
    ];
    const h = historico12(soltos, { ano: 2026, mes: 9, faturamento: 5_000, folha: 0 });
    expect(h.rbt12).toBe(144_000);
    expect(h.origem.meses).toBe(1);
  });

  it("atravessa a virada do ano", () => {
    const h = historico12([{ ano: 2025, mes: 12, faturamento: 10_000, folha: 0 }], {
      ano: 2026,
      mes: 1,
      faturamento: 1,
      folha: 0,
    });
    expect(h.origem.meses).toBe(1);
  });
});

describe("Fator R pelos 12 meses", () => {
  it("um mês de folha baixa não derruba para o Anexo V se o ano foi bom", () => {
    const anteriores: MesLancado[] = Array.from({ length: 12 }, (_, i) => ({
      ano: 2025 + Math.floor((8 + i) / 12),
      mes: ((8 + i) % 12) + 1,
      faturamento: 50_000,
      folha: 15_000, // 30% no ano
    }));
    const setembro = { ano: 2026, mes: 9, faturamento: 50_000, folha: 5_000 }; // 10% neste mês
    const entrada = { atividade: "profissionais" as const, faturamento: 50_000, folha: 5_000, custos: 0 };
    expect(calcular(entrada).anexo).toBe("V");
    expect(calcular(entrada, undefined, historico12(anteriores, setembro)).anexo).toBe("III");
  });
});

describe("mesesQueFaltam", () => {
  it("lista os buracos dos 12 anteriores, do mais recente ao mais antigo", () => {
    const lancados = [{ ano: 2026, mes: 8, faturamento: 1, folha: 0 }];
    const faltam = mesesQueFaltam(lancados, { ano: 2026, mes: 9 });
    expect(faltam).toHaveLength(11);
    expect(faltam[0]).toEqual({ ano: 2026, mes: 7 });
    expect(faltam.at(-1)).toEqual({ ano: 2025, mes: 9 });
  });
});
