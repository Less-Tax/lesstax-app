"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { criarClienteServidor } from "@/lib/db/servidor";
import { COOKIE_LEMBRAR, SEGUNDOS_LEMBRAR } from "@/lib/auth/lembrar";
import {
  esquemaCadastrar,
  esquemaEntrar,
  esquemaNovaSenha,
  esquemaRecuperar,
} from "@/lib/validacao/auth";

/** Tempo fixo da resposta de recuperação de senha, em milissegundos. */
const TEMPO_FIXO_MS = 2000;

/** Endereço do app, para montar os links que vão nos e-mails. */
function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type EstadoForm = { erro?: string; aviso?: string };

/** Traduz os erros do Supabase, que vêm em inglês. */
function traduzir(mensagem: string) {
  if (/invalid login credentials/i.test(mensagem)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(mensagem)) return "Confirme seu e-mail antes de entrar. Veja a caixa de entrada.";
  if (/user already registered/i.test(mensagem)) return "Já existe uma conta com esse e-mail.";
  if (/rate limit|too many/i.test(mensagem)) return "Muitas tentativas. Espere um minuto e tente de novo.";
  return "Não consegui concluir agora. Tente de novo em instantes.";
}

export async function entrar(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const lido = esquemaEntrar.safeParse({
    email: dados.get("email"),
    senha: dados.get("senha"),
  });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  // Grava a preferência ANTES do login: é ela que define o prazo dos
  // cookies que o signIn vai gravar em seguida.
  const lembrar = dados.get("lembrar") !== null;
  const bolachas = await cookies();
  bolachas.set(COOKIE_LEMBRAR, lembrar ? "1" : "0", {
    maxAge: lembrar ? SEGUNDOS_LEMBRAR : undefined,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: lido.data.email,
    password: lido.data.senha,
  });
  if (error) return { erro: traduzir(error.message) };

  redirect("/inicio");
}

export async function cadastrar(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const lido = esquemaCadastrar.safeParse({
    nome: dados.get("nome"),
    email: dados.get("email"),
    senha: dados.get("senha"),
  });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: lido.data.email,
    password: lido.data.senha,
    options: {
      data: { nome: lido.data.nome },   // o gatilho do banco usa isto para criar o perfil
      emailRedirectTo: `${siteUrl()}/auth/confirmar?next=/inicio`,
    },
  });
  if (error) return { erro: traduzir(error.message) };

  return { aviso: "Conta criada. Confirme o e-mail que acabamos de enviar para poder entrar." };
}

export async function recuperarSenha(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const lido = esquemaRecuperar.safeParse({ email: dados.get("email") });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  const supabase = await criarClienteServidor();

  // O envio precisa ser aguardado: é ele que grava o cookie de verificação
  // usado depois para validar o link. Sem esse cookie, o link não abre.
  const comecou = Date.now();
  await supabase.auth.resetPasswordForEmail(lido.data.email, {
    redirectTo: `${siteUrl()}/auth/confirmar?next=/nova-senha`,
  });

  // Todas as respostas levam o mesmo tempo. Sem isto, a demora entregaria
  // quem tem conta: e-mail inexistente responde na hora, e-mail real demora.
  const faltam = TEMPO_FIXO_MS - (Date.now() - comecou);
  if (faltam > 0) await new Promise((ok) => setTimeout(ok, faltam));

  return { aviso: "Se existir uma conta com esse e-mail, o link de recuperação já está a caminho." };
}

export async function definirSenha(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const lido = esquemaNovaSenha.safeParse({
    senha: dados.get("senha"),
    confirmacao: dados.get("confirmacao"),
  });
  if (!lido.success) return { erro: lido.error.issues[0].message };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: lido.data.senha });
  if (error) return { erro: traduzir(error.message) };

  redirect("/inicio");
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();

  const bolachas = await cookies();
  bolachas.delete(COOKIE_LEMBRAR);

  redirect("/entrar");
}
