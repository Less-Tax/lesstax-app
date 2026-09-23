import { z } from "zod";
import { esquemaNovaSenha } from "./auth";

const soDigitos = (v: string) => v.replace(/\D/g, "");

/** (47) 99999-9999 enquanto a pessoa digita. Aceita fixo (10) e celular (11). */
export function mascaraTelefone(valor: string) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const esquemaPerfil = z.object({
  nome: z.string().trim().min(2, "Digite seu nome.").max(80),
  // Guardado só com os dígitos. Vazio vira null.
  telefone: z
    .string()
    .transform(soDigitos)
    .refine((t) => t === "" || t.length === 10 || t.length === 11, "Telefone com DDD, 10 ou 11 números.")
    .transform((t) => t || null),
});

export type DadosPerfil = z.infer<typeof esquemaPerfil>;

/** Trocar a senha pede a atual: um celular esquecido aberto não basta. */
export const esquemaTrocarSenha = esquemaNovaSenha.and(
  z.object({ atual: z.string().min(1, "Digite sua senha atual.") }),
);
