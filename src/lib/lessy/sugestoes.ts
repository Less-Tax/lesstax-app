import { PRAZO_REFORMA, type Resultado } from "@/lib/tributario";

const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Perguntas prontas, montadas a partir do último mês lançado. No máximo quatro. */
export function sugestoes(
  atividade: string,
  ultimo: { mes: number; resultado: Resultado } | null,
  agora = new Date(),
): string[] {
  const lista: string[] = [];
  if (!ultimo) {
    lista.push("Como funciona o Simples Nacional?", "Quais números eu preciso lançar por mês?");
  } else {
    const r = ultimo.resultado;
    lista.push(`Por que meu imposto de ${MES[ultimo.mes - 1]} deu esse valor?`);
    if (atividade === "profissionais") lista.push(r.anexo === "V" ? "Como sair do Anexo V para o III?" : "Meu Fator R está seguro?");
    if (atividade === "comercio" && r.monofasicoEmDobro > 0) lista.push("O que são produtos monofásicos?");
    if (r.lucro < 0) lista.push("Por que estou tendo prejuízo?");
    else lista.push("Como posso pagar menos imposto?");
  }
  if (agora <= PRAZO_REFORMA) lista.push("Devo escolher o Simples híbrido?");
  lista.push("O que muda com a reforma tributária?");
  return [...new Set(lista)].slice(0, 4);
}
