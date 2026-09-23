import { describe, expect, it } from "vitest";
import { calcular, manchete, oportunidades } from "./index";
import type { Contexto, Entrada } from "./index";

const ANTES_DO_PRAZO = new Date("2026-09-22T12:00:00-03:00");
const DEPOIS_DO_PRAZO = new Date("2026-10-01T12:00:00-03:00");

function contexto(entrada: Entrada, extra: Partial<Contexto> = {}): Contexto {
  return { entrada, resultado: calcular(entrada), clientes: "pf", regime: "simples", hoje: ANTES_DO_PRAZO, ...extra };
}
const ids = (ctx: Contexto) => oportunidades(ctx).map((c) => c.id);
const cartao = (ctx: Contexto, id: string) => oportunidades(ctx).find((c) => c.id === id);

const studio: Entrada = { atividade: "profissionais", faturamento: 60_000, folha: 12_000, custos: 20_000 };

describe("manchete", () => {
  it("resume imposto e lucro do mês", () => {
    const m = manchete({ entrada: studio, resultado: calcular(studio) });
    expect(m).toContain("10.875");
    expect(m).toContain("18,1%");
    expect(m).toContain("17.125");
  });

  it("fala de prejuízo quando as saídas passam o faturamento", () => {
    const e: Entrada = { atividade: "comercio", faturamento: 10_000, folha: 8_000, custos: 5_000 };
    expect(manchete({ entrada: e, resultado: calcular(e) })).toContain("passam o faturamento");
  });

  it("acima do teto não fala em imposto do Simples", () => {
    const e: Entrada = { atividade: "comercio", faturamento: 500_000, folha: 0, custos: 0 };
    expect(manchete({ entrada: e, resultado: calcular(e) })).toContain("limite do Simples");
  });
});

describe("Fator R", () => {
  it("no Anexo V mostra a economia de subir o pró-labore até 28%", () => {
    const c = cartao(contexto(studio), "fator-r");
    expect(c?.tom).toBe("oportunidade");
    // aumento: 28% de 60.000 − 12.000 = 4.800
    // economia: 10.875 (Anexo V) − 6.630 (Anexo III) − 528 (11% de INSS) = 3.717
    expect(c?.destaque?.rotulo).toContain("4.800");
    expect(c?.destaque?.valor).toContain("3.717");
  });

  it("no Anexo III avisa que o Fator R está a favor", () => {
    const c = cartao(contexto({ ...studio, folha: 18_000 }), "fator-r");
    expect(c?.tom).toBe("positivo");
  });

  it("não aparece para quem não é serviço técnico", () => {
    expect(ids(contexto({ ...studio, atividade: "comercio" }))).not.toContain("fator-r");
  });
});

describe("reforma tributária", () => {
  it("conta os dias até 30 de setembro", () => {
    expect(cartao(contexto(studio), "reforma")?.etiqueta).toBe("Faltam 9 dias");
  });

  it("depois do prazo aponta a próxima janela", () => {
    expect(cartao(contexto(studio, { hoje: DEPOIS_DO_PRAZO }), "reforma")?.etiqueta).toBe("Próxima janela: março de 2027");
  });

  it("muda a recomendação conforme para quem a empresa vende", () => {
    expect(cartao(contexto(studio, { clientes: "pj" }), "reforma")?.paragrafos[1]).toContain("híbrido");
    expect(cartao(contexto(studio, { clientes: "pf" }), "reforma")?.paragrafos[1]).toContain("dentro do DAS");
  });

  it("MEI fica de fora da escolha", () => {
    const lista = ids(contexto(studio, { regime: "mei" }));
    expect(lista).not.toContain("reforma");
    expect(lista).toContain("mei");
  });
});

describe("outros cartões", () => {
  it("monofásicos no comércio", () => {
    const e: Entrada = { atividade: "comercio", faturamento: 100_000, folha: 0, custos: 0, monofasico: 0.5 };
    const c = cartao(contexto(e), "monofasico");
    expect(c?.destaque?.valor).toContain("684");
  });

  it("INSS fora da guia em obras", () => {
    const e: Entrada = { atividade: "obras", faturamento: 50_000, folha: 15_000, custos: 0 };
    expect(cartao(contexto(e), "inss-fora")?.paragrafos[0]).toContain("3.000");
  });

  it("sublimite avisa que ICMS/ISS não entram na conta", () => {
    const e: Entrada = { atividade: "comercio", faturamento: 350_000, folha: 0, custos: 0 };
    expect(cartao(contexto(e), "sublimite")?.paragrafos[0]).toContain("não estão incluídos");
  });

  it("acima do teto mostra só o cartão de fora do Simples", () => {
    const e: Entrada = { atividade: "profissionais", faturamento: 500_000, folha: 10_000, custos: 0 };
    expect(ids(contexto(e))).toEqual(["fora-do-simples"]);
  });

  it("empresa fora do Simples na Receita recebe o alerta primeiro", () => {
    expect(ids(contexto(studio, { regime: "lucro_real" }))[0]).toBe("regime");
  });
});
