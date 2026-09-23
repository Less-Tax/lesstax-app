import { describe, expect, it } from "vitest";
import { ehAdmin, emailsAdmin } from "./regras";

const lista = emailsAdmin(" Matheus@Exemplo.com , outra@exemplo.com,, ");
const confirmado = "2026-09-01T00:00:00Z";

describe("admin", () => {
  it("lê a lista ignorando espaços, vazios e maiúsculas", () => {
    expect([...lista]).toEqual(["matheus@exemplo.com", "outra@exemplo.com"]);
  });
  it("só é admin com e-mail listado e confirmado", () => {
    expect(ehAdmin({ email: "MATHEUS@exemplo.com", email_confirmed_at: confirmado }, lista)).toBe(true);
    expect(ehAdmin({ email: "matheus@exemplo.com", email_confirmed_at: null }, lista)).toBe(false);
    expect(ehAdmin({ email: "intruso@exemplo.com", email_confirmed_at: confirmado }, lista)).toBe(false);
    expect(ehAdmin(null, lista)).toBe(false);
  });
  it("lista vazia não libera ninguém", () => {
    expect(ehAdmin({ email: "a@b.com", email_confirmed_at: confirmado }, emailsAdmin(""))).toBe(false);
  });
});
