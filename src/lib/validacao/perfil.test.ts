import { describe, expect, it } from "vitest";
import { esquemaPerfil, esquemaTrocarSenha, mascaraTelefone } from "./perfil";

describe("mascaraTelefone", () => {
  it("formata celular e fixo enquanto digita", () => {
    expect(mascaraTelefone("")).toBe("");
    expect(mascaraTelefone("4")).toBe("(4");
    expect(mascaraTelefone("4799")).toBe("(47) 99");
    expect(mascaraTelefone("4733221100")).toBe("(47) 3322-1100");
    expect(mascaraTelefone("47999887766")).toBe("(47) 99988-7766");
    expect(mascaraTelefone("47 99988-77669999")).toBe("(47) 99988-7766");
  });
});

describe("esquemaPerfil", () => {
  it("guarda só os dígitos e aceita telefone vazio", () => {
    expect(esquemaPerfil.parse({ nome: " Ana ", telefone: "(47) 99988-7766" })).toEqual({ nome: "Ana", telefone: "47999887766" });
    expect(esquemaPerfil.parse({ nome: "Ana", telefone: "" }).telefone).toBeNull();
  });
  it("recusa telefone incompleto", () => {
    expect(esquemaPerfil.safeParse({ nome: "Ana", telefone: "(47) 9998" }).success).toBe(false);
  });
});

describe("esquemaTrocarSenha", () => {
  it("pede a senha atual e as regras da nova", () => {
    expect(esquemaTrocarSenha.safeParse({ atual: "", senha: "Nova1234", confirmacao: "Nova1234" }).success).toBe(false);
    expect(esquemaTrocarSenha.safeParse({ atual: "x", senha: "fraca", confirmacao: "fraca" }).success).toBe(false);
    expect(esquemaTrocarSenha.safeParse({ atual: "x", senha: "Nova1234", confirmacao: "Outra123" }).success).toBe(false);
    expect(esquemaTrocarSenha.safeParse({ atual: "x", senha: "Nova1234", confirmacao: "Nova1234" }).success).toBe(true);
  });
});
