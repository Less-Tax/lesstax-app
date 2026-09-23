/** Formatos em português usados nas telas. */
export { reais, porcento } from "@/lib/tributario/formato";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const nomeDoMes = (mes: number) => MESES[mes - 1] ?? "";

/** "Setembro de 2026" */
export const competencia = (ano: number, mes: number) => {
  const nome = nomeDoMes(mes);
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
};
