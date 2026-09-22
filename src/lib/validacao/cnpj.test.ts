import { describe, expect, it } from "vitest";
import { cnpjValido, mascaraCnpj, soDigitos } from "./cnpj";

describe("cnpj", () => {
  it("aplica a máscara enquanto a pessoa digita", () => {
    expect(mascaraCnpj("4796")).toBe("47.96");
    expect(mascaraCnpj("47960950000121")).toBe("47.960.950/0001-21");
    expect(mascaraCnpj("47.960.950/0001-21999")).toBe("47.960.950/0001-21");
  });

  it("aceita CNPJs reais", () => {
    expect(cnpjValido("47.960.950/0001-21")).toBe(true); // Magazine Luiza
    expect(cnpjValido("33000167000101")).toBe(true); // Petrobras
  });

  it("recusa dígito verificador errado", () => {
    expect(cnpjValido("47960950000122")).toBe(false);
  });

  it("recusa números repetidos e tamanho errado", () => {
    expect(cnpjValido("11111111111111")).toBe(false);
    expect(cnpjValido("4796095000012")).toBe(false);
    expect(cnpjValido("")).toBe(false);
  });

  it("tira tudo que não é dígito", () => {
    expect(soDigitos("47.960.950/0001-21")).toBe("47960950000121");
  });
});
