import { describe, expect, it } from "vitest";
import { ehPremium, mesesLiberados, nomeDoPlano } from "./regras";

const meses = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

describe("planos", () => {
  it("gratuito abre só os 3 meses mais recentes", () => {
    expect([...mesesLiberados("gratuito", meses)]).toEqual(["2026-06", "2026-07", "2026-08"]);
  });
  it("premium abre todos", () => {
    expect(mesesLiberados("pago", meses).size).toBe(5);
    expect(mesesLiberados("assessoria", meses).size).toBe(5);
  });
  it("nomes", () => {
    expect(ehPremium("gratuito")).toBe(false);
    expect(nomeDoPlano("pago")).toBe("Premium");
    expect(nomeDoPlano("gratuito")).toBe("Gratuito");
  });
});
