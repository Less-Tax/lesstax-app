import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino";

describe("destinoSeguro", () => {
  it("aceita caminhos internos", () => {
    expect(destinoSeguro("/nova-senha")).toBe("/nova-senha");
    expect(destinoSeguro("/meses?mes=2026-08")).toBe("/meses?mes=2026-08");
  });
  it("recusa o que levaria para fora do site", () => {
    for (const ruim of ["@evil.com", "//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "/\tevil", "", null]) {
      expect(destinoSeguro(ruim)).toBe("/inicio");
    }
  });
});
