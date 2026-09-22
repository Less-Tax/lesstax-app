import { z } from "zod";

export const esquemaEntrar = z.object({
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
  senha: z.string().min(1, "Digite sua senha."),
});

export const esquemaCadastrar = z.object({
  nome: z.string().trim().min(2, "Digite seu nome.").max(80),
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const esquemaRecuperar = z.object({
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
});

export const esquemaNovaSenha = z
  .object({
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As duas senhas não são iguais.",
    path: ["confirmacao"],
  });
