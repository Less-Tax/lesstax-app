import { criarClienteServidor } from "@/lib/db/servidor";

/** Usuário logado, ou null. Usa getUser(), que valida o token no servidor. */
export async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
