/**
 * Competência = um mês de um ano. Na URL vira "2026-08".
 * Puro: serve para as telas e para o servidor.
 */
export type Competencia = { ano: number; mes: number };

export const chave = ({ ano, mes }: Competencia) => `${ano}-${String(mes).padStart(2, "0")}`;

export function lerChave(texto: string | null | undefined): Competencia | null {
  const m = /^(\d{4})-(\d{2})$/.exec(texto ?? "");
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (ano < 2000 || ano > 2100 || mes < 1 || mes > 12) return null;
  return { ano, mes };
}

export const somar = ({ ano, mes }: Competencia, meses: number): Competencia => {
  const total = ano * 12 + (mes - 1) + meses;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
};

export const comparar = (a: Competencia, b: Competencia) => a.ano * 12 + a.mes - (b.ano * 12 + b.mes);

/** Mês corrente no horário de Brasília (o servidor roda em UTC). */
export function mesAtual(agora = new Date()): Competencia {
  const [ano, mes] = agora
    .toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
    .split("-")
    .map(Number);
  return { ano, mes };
}

/** O mês que acabou de fechar: o padrão para lançar. */
export const ultimoMesFechado = (agora = new Date()) => somar(mesAtual(agora), -1);
