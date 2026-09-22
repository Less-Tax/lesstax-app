import { z } from "zod";

/**
 * Regras da senha. Ficam aqui, num lugar só: a tela usa para mostrar o que
 * falta enquanto a pessoa digita, e o servidor usa para validar de verdade.
 */
export const REGRAS_SENHA = [
  { id: "tamanho", texto: "Pelo menos 8 caracteres", vale: (s: string) => s.length >= 8 },
  { id: "maiuscula", texto: "Uma letra maiúscula", vale: (s: string) => /[A-ZÀ-Ý]/.test(s) },
  { id: "minuscula", texto: "Uma letra minúscula", vale: (s: string) => /[a-zà-ÿ]/.test(s) },
  { id: "numero", texto: "Um número", vale: (s: string) => /[0-9]/.test(s) },
] as const;

/** 0 a 4: quantas regras a senha já cumpre. */
export function forcaDaSenha(senha: string) {
  return REGRAS_SENHA.filter((r) => r.vale(senha)).length;
}

const senha = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .regex(/[A-ZÀ-Ý]/, "A senha precisa ter pelo menos uma letra maiúscula.")
  .regex(/[a-zà-ÿ]/, "A senha precisa ter pelo menos uma letra minúscula.")
  .regex(/[0-9]/, "A senha precisa ter pelo menos um número.");

const email = z.string().trim().toLowerCase().email("Digite um e-mail válido.");

const iguais = (d: { senha: string; confirmacao: string }) => d.senha === d.confirmacao;
const avisoIguais = { message: "As duas senhas não são iguais.", path: ["confirmacao"] };

export const esquemaEntrar = z.object({
  email,
  senha: z.string().min(1, "Digite sua senha."),
});

export const esquemaCadastrar = z
  .object({
    nome: z.string().trim().min(2, "Digite seu nome.").max(80),
    email,
    senha,
    confirmacao: z.string(),
  })
  .refine(iguais, avisoIguais);

export const esquemaRecuperar = z.object({ email });

export const esquemaNovaSenha = z
  .object({ senha, confirmacao: z.string() })
  .refine(iguais, avisoIguais);
