import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { atividadePorCnae } = await import("./brasilapi");

describe("atividadePorCnae", () => {
  it.each([
    [4713004, "comercio"], // lojas de departamento
    [1113502, "industria"], // cerveja
    [4120400, "obras"], // construção de edifícios
    [8121400, "obras"], // limpeza de prédios
    [6201501, "profissionais"], // desenvolvimento de software
    [6920601, "profissionais"], // contabilidade
    [8630501, "profissionais"], // clínica médica
    [5611201, "servicos"], // restaurante
    [600001, "industria"], // extração de petróleo (código com 6 dígitos)
  ] as const)("CNAE %i → %s", (cnae, atividade) => {
    expect(atividadePorCnae(cnae)).toBe(atividade);
  });

  it("sem CNAE não sugere nada", () => {
    expect(atividadePorCnae(null)).toBeNull();
    expect(atividadePorCnae(undefined)).toBeNull();
  });
});
