const fuso = { timeZone: "America/Sao_Paulo" } as const;

/** 23/09/2026 */
export const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", fuso) : "—";

/** 23/09/2026 14:05 */
export const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { ...fuso, dateStyle: "short", timeStyle: "short" }) : "—";

/** 12.345.678/0001-90 */
export const cnpj = (c: string | null) =>
  c && c.length === 14 ? `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}` : "—";
