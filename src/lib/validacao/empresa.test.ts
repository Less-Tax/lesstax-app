import { describe, expect, it } from "vitest";
import { esquemaEmpresa } from "./empresa";

const valido = { cnpj: "", nome: "Padaria da Ana", atividade: "comercio", clientes: "pf", funcionarios: "4" };

describe("esquemaEmpresa", () => {
  it("aceita empresa sem CNPJ", () => {
    const r = esquemaEmpresa.safeParse(valido);
    expect(r.success).toBe(true);
    expect(r.data?.funcionarios).toBe(4); // veio texto do formulário, virou número
  });

  it("guarda o CNPJ só com dígitos", () => {
    const r = esquemaEmpresa.safeParse({ ...valido, cnpj: "47.960.950/0001-21" });
    expect(r.data?.cnpj).toBe("47960950000121");
  });

  it("recusa CNPJ inválido", () => {
    const r = esquemaEmpresa.safeParse({ ...valido, cnpj: "47.960.950/0001-22" });
    expect(r.success).toBe(false);
  });

  it("recusa atividade fora da lista", () => {
    expect(esquemaEmpresa.safeParse({ ...valido, atividade: "hackear" }).success).toBe(false);
    expect(esquemaEmpresa.safeParse({ ...valido, atividade: "" }).success).toBe(false);
  });

  it("recusa número de funcionários negativo ou quebrado", () => {
    expect(esquemaEmpresa.safeParse({ ...valido, funcionarios: "-1" }).success).toBe(false);
    expect(esquemaEmpresa.safeParse({ ...valido, funcionarios: "2.5" }).success).toBe(false);
  });
});
