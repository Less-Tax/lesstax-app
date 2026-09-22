import { describe, expect, it } from "vitest";
import { VERSAO_REGRAS } from "./index";

// Primeiro teste, só para provar que o caminho funciona.
// Os testes de verdade entram junto com o cálculo portado do MVP.
describe("tributario", () => {
  it("declara a versão das regras", () => {
    expect(VERSAO_REGRAS).toBe("simples-2026");
  });
});
