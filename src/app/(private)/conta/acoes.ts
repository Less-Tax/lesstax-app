"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth/usuario";
import { criarClienteServidor } from "@/lib/db/servidor";
import { salvarPerfil } from "@/lib/db/perfis";
import { esquemaPerfil, esquemaTrocarSenha } from "@/lib/validacao/perfil";

/** `vez` muda a cada sucesso: a tela usa para limpar os campos. */
export type EstadoConta = { erro?: string; ok?: string; vez?: number };

export async function salvarDados(_anterior: EstadoConta, dados: FormData): Promise<EstadoConta> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");

  const lido = esquemaPerfil.safeParse({ nome: dados.get("nome"), telefone: dados.get("telefone") ?? "" });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  try {
    await salvarPerfil(usuario.id, lido.data);
  } catch (erro) {
    console.error(erro);
    return { erro: "Não consegui salvar agora. Tente de novo em instantes." };
  }

  revalidatePath("/conta");
  return { ok: "Dados salvos.", vez: Date.now() };
}

export async function trocarSenha(_anterior: EstadoConta, dados: FormData): Promise<EstadoConta> {
  const usuario = await usuarioAtual();
  if (!usuario?.email) redirect("/entrar");

  const lido = esquemaTrocarSenha.safeParse({
    atual: dados.get("atual"),
    senha: dados.get("senha"),
    confirmacao: dados.get("confirmacao"),
  });
  if (!lido.success) return { erro: lido.error.issues[0].message };
  if (lido.data.atual === lido.data.senha) return { erro: "A senha nova precisa ser diferente da atual." };

  const supabase = await criarClienteServidor();

  // Confere a senha atual entrando de novo com ela. O Supabase limita as
  // tentativas, então isto não vira um jeito de adivinhar senha.
  const { error: erroAtual } = await supabase.auth.signInWithPassword({
    email: usuario.email,
    password: lido.data.atual,
  });
  if (erroAtual) {
    return {
      erro: /invalid login credentials/i.test(erroAtual.message)
        ? "A senha atual não confere."
        : "Não consegui conferir sua senha agora. Tente de novo em instantes.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: lido.data.senha });
  if (error) {
    console.error("[conta] trocar senha:", error.message);
    return { erro: "Não consegui trocar a senha agora. Tente de novo em instantes." };
  }

  return { ok: "Senha trocada.", vez: Date.now() };
}
