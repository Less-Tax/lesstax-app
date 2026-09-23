import { describe, expect, it } from "vitest";
import { calcular, historico12, receitaDoAno, situacaoNoAno, type MesLancado } from "./index";

// Comércio. 2025: R$ 150 mil/mês. 2026: R$ 200 mil/mês até agosto; setembro completa a RBA; outubro R$ 100 mil.
function empresa(rbaAteSetembro: number): MesLancado[] {
  const m: MesLancado[] = [];
  for (let mes = 1; mes <= 12; mes++) m.push({ ano: 2025, mes, faturamento: 150_000, folha: 20_000 });
  for (let mes = 1; mes <= 8; mes++) m.push({ ano: 2026, mes, faturamento: 200_000, folha: 20_000 });
  m.push({ ano: 2026, mes: 9, faturamento: Math.round((rbaAteSetembro - 1_600_000) * 100) / 100, folha: 20_000 });
  m.push({ ano: 2026, mes: 10, faturamento: 100_000, folha: 20_000 });
  return m;
}
const mes = (meses: MesLancado[], n: number) => meses.find((m) => m.ano === 2026 && m.mes === n)!;
const situacao = (meses: MesLancado[], n: number) => situacaoNoAno(receitaDoAno(meses, mes(meses, n)));
const ids = (s: ReturnType<typeof situacaoNoAno>) => s.avisos.map((a) => a.id);

describe("patamares pela receita do ano (RBA)", () => {
  it("RBA de exatamente R$ 3.600.000: tudo no DAS, só alerta de proximidade", () => {
    const s = situacao(empresa(3_600_000), 9);
    expect(s).toMatchObject({ noSimples: true, icmsIssNoDas: true });
    expect(ids(s)).toContain("perto-sublimite");
    expect(ids(s)).not.toContain("sublimite");
  });

  it("R$ 3.600.000,01: ICMS/ISS seguem no DAS até dezembro; aviso com prazo de janeiro", () => {
    const m = empresa(3_600_000.01);
    expect(situacao(m, 9).icmsIssNoDas).toBe(true);
    expect(situacao(m, 10).icmsIssNoDas).toBe(true);
    const aviso = situacao(m, 9).avisos.find((a) => a.id === "sublimite")!;
    expect(aviso.texto).toContain("janeiro de 2027");
    expect(aviso.texto).toContain("art. 30");
  });

  it("R$ 4.320.000,01: ICMS/ISS saem no mês seguinte ao excesso", () => {
    const m = empresa(4_320_000.01);
    expect(situacao(m, 9).icmsIssNoDas).toBe(true); // o mês do excesso ainda é no DAS
    expect(situacao(m, 10).icmsIssNoDas).toBe(false);
    expect(situacao(m, 10).noSimples).toBe(true);
    expect(situacao(m, 9).avisos.find((a) => a.id === "sublimite-20")!.texto).toContain("outubro de 2026");
  });

  it("R$ 4.800.000,01: federais seguem até dezembro; sai do Simples em janeiro", () => {
    const m = empresa(4_800_000.01);
    expect(situacao(m, 10).noSimples).toBe(true);
    expect(situacao(m, 10).icmsIssNoDas).toBe(false);
    expect(situacao(m, 9).avisos.find((a) => a.id === "teto")!.texto).toContain("janeiro de 2027");
  });

  it("R$ 5.760.000,01: sai do Simples no mês seguinte", () => {
    const m = empresa(5_760_000.01);
    expect(situacao(m, 9).noSimples).toBe(true);
    expect(situacao(m, 10).noSimples).toBe(false);
    expect(ids(situacao(m, 9))).toEqual(["teto-20"]);
  });

  it("ano anterior acima de R$ 4,8 mi: fora do Simples desde janeiro, mas o cálculo segue", () => {
    const m: MesLancado[] = [];
    for (let n = 1; n <= 12; n++) m.push({ ano: 2025, mes: n, faturamento: n === 12 ? 4_915_000 - 11 * 409_583 : 409_583, folha: 50_000 });
    m.push({ ano: 2026, mes: 1, faturamento: 300_000, folha: 50_000 });
    const jan = mes(m, 1);
    const r = calcular({ atividade: "comercio", faturamento: 300_000, folha: 50_000, custos: 0 }, undefined, historico12(m, jan));
    expect(r.rbt12).toBe(4_915_000);
    expect(r.faixa).toBe(6);
    expect(r.das).toBeGreaterThan(0);
    expect(r.foraDoSimples).toBe(true);
    expect(r.situacao.avisos[0].id).toBe("fora-ano-anterior");
  });

  it("ICMS/ISS fora do DAS tiram a parte deles na faixa 5 (Anexo I, 33,5%)", () => {
    const m = empresa(4_320_000.01);
    const h = historico12(m, mes(m, 10));
    const cheio = calcular({ atividade: "comercio", faturamento: 100_000, folha: 0, custos: 0 }, undefined, { ...h, rbt12: 3_000_000, ano: { ...h.ano!, rbaAnoAnterior: 0, rbaAteMesAnterior: 0, excessos: {} } });
    const fora = calcular({ atividade: "comercio", faturamento: 100_000, folha: 0, custos: 0 }, undefined, { ...h, rbt12: 3_000_000 });
    expect(cheio.icmsIssFora).toBe(false);
    expect(fora.icmsIssFora).toBe(true);
    expect(fora.das).toBeCloseTo(cheio.das * (1 - 0.335), 1);
  });
});
