import { z } from "zod";
import { cnpjValido, soDigitos } from "./cnpj";

export const ATIVIDADES = {
  comercio: "Vende produtos",
  industria: "Fabrica produtos",
  servicos: "Serviços gerais",
  profissionais: "Serviços técnicos",
  obras: "Obras, limpeza ou vigilância",
} as const;

export const CLIENTES = {
  pf: "Pessoas",
  pj: "Empresas",
  ambos: "Os dois",
} as const;

export const esquemaEmpresa = z.object({
  // O CNPJ é opcional: quem não quiser informar preenche tudo à mão.
  cnpj: z
    .string()
    .transform(soDigitos)
    .refine((c) => c === "" || cnpjValido(c), "CNPJ inválido. Confira os números."),
  nome: z.string().trim().min(2, "Informe o nome da empresa.").max(60),
  atividade: z.enum(Object.keys(ATIVIDADES) as [keyof typeof ATIVIDADES], {
    error: "Escolha o que a empresa faz.",
  }),
  clientes: z.enum(Object.keys(CLIENTES) as [keyof typeof CLIENTES], {
    error: "Escolha para quem a empresa mais vende.",
  }),
  funcionarios: z.coerce
    .number({ error: "Informe quantas pessoas trabalham na empresa." })
    .int("Use um número inteiro.")
    .min(0, "Use um número positivo.")
    .max(100_000),
});

export type DadosEmpresa = z.infer<typeof esquemaEmpresa>;
