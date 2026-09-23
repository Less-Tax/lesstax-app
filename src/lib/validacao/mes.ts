import { z } from "zod";

/**
 * Lê um valor em reais do jeito que o brasileiro digita: "60.000", "60.000,50",
 * "60000". Ponto é milhar, vírgula é centavo. Devolve NaN se não for número.
 */
export function lerDinheiro(valor: unknown): number {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").trim();
  if (!texto) return Number.NaN;
  const limpo = texto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return limpo ? Number(limpo) : Number.NaN;
}

/** Formata enquanto digita: 70000 vira 70.000; aceita centavos depois da vírgula. */
export function mascaraDinheiro(texto: string) {
  const bruto = texto.replace(/[^\d,]/g, "");
  const i = bruto.indexOf(",");
  let inteiro = (i >= 0 ? bruto.slice(0, i) : bruto).replace(/^0+(?=\d)/, "");
  const decimais = i >= 0 ? "," + bruto.slice(i + 1).replace(/,/g, "").slice(0, 2) : "";
  inteiro = inteiro.slice(0, 12).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (i >= 0 && !inteiro) inteiro = "0";
  return inteiro + decimais;
}

const TETO = 999_999_999_999;
const dinheiro = (rotulo: string, obrigatorio: boolean) =>
  z.preprocess(
    (v) => (!obrigatorio && (v === "" || v === null || v === undefined) ? 0 : lerDinheiro(v)),
    z
      .number({ error: `Informe ${rotulo}.` })
      .refine((n) => !Number.isNaN(n), `Informe ${rotulo}.`)
      .refine((n) => n >= 0, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} não pode ser negativo.`)
      .refine((n) => n <= TETO, "Valor alto demais."),
  );

export const esquemaMes = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
  faturamento: dinheiro("quanto entrou no mês", true).refine((n) => n > 0, "Informe quanto entrou no mês."),
  folha: dinheiro("salários e pró-labore", false),
  custos: dinheiro("o custo total", false),
  monofasico: z.coerce.number().min(0).max(1).default(0),
});

export type DadosMes = z.infer<typeof esquemaMes>;

/** 60000 → "60.000"; 60000.5 → "60.000,50". Para preencher o campo com um valor salvo. */
export function formatarDinheiro(valor: number) {
  const [inteiro, decimais] = valor.toFixed(2).split(".");
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimais === "00" ? comPontos : `${comPontos},${decimais}`;
}
