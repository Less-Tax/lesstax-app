import { describe, expect, it } from "vitest";
import { corDaSaude, missoes, nivel, saude, type ContextoMissoes } from "./regras";

const base: ContextoMissoes = {
  atividade: "profissionais",
  lancados: [],
  marcadas: new Set(),
  perguntouAoLessy: false,
  pediuEspecialista: false,
  agora: new Date("2026-09-23T12:00:00-03:00"),
};

const ultimos = (n: number) => Array.from({ length: n }, (_, i) => ({ ano: i < 8 ? 2026 : 2025, mes: i < 8 ? 8 - i : 20 - i }));

describe("missões", () => {
  it("empresa nova: tudo pendente, com a reforma porque a janela está aberta", () => {
    const lista = missoes(base);
    expect(lista.map((m) => m.id)).toEqual(["mes", "historico", "fator_r", "reforma", "lessy", "especialista"]);
    expect(lista.every((m) => !m.feita)).toBe(true);
    expect(lista[0].titulo).toBe("Lançar agosto");
    expect(saude(lista)).toBe(0);
  });

  it("13 meses lançados completam o mês e o histórico", () => {
    const lista = missoes({ ...base, lancados: ultimos(13) });
    expect(lista.find((m) => m.id === "mes")?.feita).toBe(true);
    expect(lista.find((m) => m.id === "historico")?.feita).toBe(true);
  });

  it("histórico aponta o mês mais recente que falta", () => {
    const lista = missoes({ ...base, lancados: [{ ano: 2026, mes: 8 }, { ano: 2026, mes: 7 }] });
    const h = lista.find((m) => m.id === "historico")!;
    expect(h.descricao).toContain("Faltam 11 meses");
    expect(h.acao).toMatchObject({ tipo: "link", href: "/meses?mes=2026-06" });
  });

  it("a missão da atividade muda com o ramo", () => {
    expect(missoes({ ...base, atividade: "comercio" }).some((m) => m.id === "monofasico")).toBe(true);
    expect(missoes({ ...base, atividade: "servicos" }).some((m) => m.id === "anexo")).toBe(true);
  });

  it("a reforma some depois da janela, a não ser que já tenha sido marcada", () => {
    const depois = new Date("2026-10-05T12:00:00-03:00");
    expect(missoes({ ...base, agora: depois }).some((m) => m.id === "reforma")).toBe(false);
    const marcada = missoes({ ...base, agora: depois, marcadas: new Set(["reforma:2027-1"]) });
    expect(marcada.find((m) => m.id === "reforma")?.feita).toBe(true);
  });

  it("saúde, nível e cor", () => {
    const tudo = missoes({
      ...base,
      lancados: ultimos(13),
      marcadas: new Set(["fator_r:sempre", "reforma:2027-1"]),
      perguntouAoLessy: true,
      pediuEspecialista: true,
    });
    expect(saude(tudo)).toBe(100);
    expect(nivel(100)).toBe("No controle");
    expect(nivel(50)).toBe("Atento");
    expect(nivel(10)).toBe("Começando");
    expect(corDaSaude(0)).toBe("hsl(0 85% 46%)");
    expect(corDaSaude(100)).toBe("hsl(163 74% 33%)");
  });
});
