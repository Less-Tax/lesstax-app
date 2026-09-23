import "server-only";
import { criarClienteServidor } from "@/lib/db/servidor";
import type { DadosPerfil } from "@/lib/validacao/perfil";

export type Perfil = { id: string; nome: string | null; telefone: string | null };

/** O perfil de quem está logado. A RLS só devolve o próprio. */
export async function perfilAtual(): Promise<Perfil | null> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("perfis").select("id, nome, telefone").maybeSingle();
  if (error) throw new Error(`[perfis] ler: ${error.message}`);
  return data;
}

export async function salvarPerfil(id: string, dados: DadosPerfil) {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("perfis").update({ nome: dados.nome, telefone: dados.telefone }).eq("id", id);
  if (error) throw new Error(`[perfis] salvar: ${error.message}`);
}
