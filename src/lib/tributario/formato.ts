/** Formatos de dinheiro e porcentagem em português. */

export const reais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const porcento = (fracao: number) =>
  (fracao * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
