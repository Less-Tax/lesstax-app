import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/db/servidor";

/** Usuário logado, ou null. Usa getUser(), que valida o token no servidor. */
export async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Para telas públicas: quem já está logado não precisa ver landing nem login.
 * É o espelho da checagem feita no layout de (private).
 */
export async function mandarParaInicioSeLogado() {
  const usuario = await usuarioAtual();
  if (usuario) redirect("/inicio");
}
