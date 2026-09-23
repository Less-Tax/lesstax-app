import { describe, expect, it } from "vitest";
import { chave, comparar, lerChave, mesAtual, somar, ultimoMesFechado } from "./competencia";

describe("competência", () => {
  it("vai e volta da URL", () => {
    expect(chave({ ano: 2026, mes: 8 })).toBe("2026-08");
    expect(lerChave("2026-08")).toEqual({ ano: 2026, mes: 8 });
  });

  it("recusa lixo na URL", () => {
    expect(lerChave("2026-13")).toBeNull();
    expect(lerChave("2026-8")).toBeNull();
    expect(lerChave("abc")).toBeNull();
    expect(lerChave(null)).toBeNull();
  });

  it("anda para frente e para trás atravessando o ano", () => {
    expect(somar({ ano: 2026, mes: 1 }, -1)).toEqual({ ano: 2025, mes: 12 });
    expect(somar({ ano: 2025, mes: 12 }, 1)).toEqual({ ano: 2026, mes: 1 });
    expect(somar({ ano: 2026, mes: 8 }, -12)).toEqual({ ano: 2025, mes: 8 });
  });

  it("compara meses", () => {
    expect(comparar({ ano: 2026, mes: 1 }, { ano: 2025, mes: 12 })).toBe(1);
  });

  it("usa o horário de Brasília na virada do mês", () => {
    // 1º de outubro, 01h UTC = ainda 30 de setembro, 22h em Brasília
    const virada = new Date("2026-10-01T01:00:00Z");
    expect(mesAtual(virada)).toEqual({ ano: 2026, mes: 9 });
    expect(ultimoMesFechado(virada)).toEqual({ ano: 2026, mes: 8 });
  });
});
