import { describe, expect, it } from "vitest";
import { esquemaMes, formatarDinheiro, lerDinheiro, mascaraDinheiro } from "./mes";

describe("lerDinheiro", () => {
  it("entende o jeito brasileiro de escrever", () => {
    expect(lerDinheiro("60.000")).toBe(60_000);
    expect(lerDinheiro("60.000,50")).toBe(60_000.5);
    expect(lerDinheiro("60000")).toBe(60_000);
    expect(lerDinheiro("R$ 1.234,56")).toBe(1_234.56);
  });

  it("vazio ou texto vira NaN", () => {
    expect(lerDinheiro("")).toBeNaN();
    expect(lerDinheiro("abc")).toBeNaN();
  });
});

describe("mascaraDinheiro", () => {
  it("põe o ponto de milhar enquanto digita", () => {
    expect(mascaraDinheiro("70000")).toBe("70.000");
    expect(mascaraDinheiro("70000,5")).toBe("70.000,5");
    expect(mascaraDinheiro("0012")).toBe("12");
    expect(mascaraDinheiro(",5")).toBe("0,5");
  });
});

describe("esquemaMes", () => {
  const base = { ano: "2026", mes: "9", faturamento: "60.000", folha: "12.000", custos: "20.000", monofasico: "0" };

  it("aceita um mês comum e converte os valores", () => {
    const r = esquemaMes.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ ano: 2026, mes: 9, faturamento: 60_000, folha: 12_000, custos: 20_000 });
  });

  it("folha e custos em branco viram zero", () => {
    const r = esquemaMes.safeParse({ ...base, folha: "", custos: "" });
    expect(r.data).toMatchObject({ folha: 0, custos: 0 });
  });

  it("recusa faturamento zero ou vazio", () => {
    expect(esquemaMes.safeParse({ ...base, faturamento: "0" }).success).toBe(false);
    expect(esquemaMes.safeParse({ ...base, faturamento: "" }).success).toBe(false);
  });

  it("recusa mês fora de 1 a 12", () => {
    expect(esquemaMes.safeParse({ ...base, mes: "13" }).success).toBe(false);
  });
});

describe("formatarDinheiro", () => {
  it("escreve o valor salvo do jeito que a pessoa digitaria", () => {
    expect(formatarDinheiro(60_000)).toBe("60.000");
    expect(formatarDinheiro(60_000.5)).toBe("60.000,50");
    expect(formatarDinheiro(0)).toBe("0");
    expect(lerDinheiro(formatarDinheiro(1_234_567.89))).toBe(1_234_567.89);
  });
});
