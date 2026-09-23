import "server-only";
import { criarClienteServidor } from "@/lib/db/servidor";
import type { Entrada, Resultado } from "@/lib/tributario";

/** A simulação guarda também o mês a que se refere, dentro da entrada. */
export type EntradaGuardada = Entrada & { ano: number; mes: number };

export type Simulacao = {
  id: string;
  entrada: EntradaGuardada;
  resultado: Resultado;
  regras_versao: string;
  criada_em: string;
};

/**
 * Registra o que foi mostrado ao cliente. Simulação nunca é recalculada:
 * se a regra mudar, nasce uma simulação nova e esta fica como foi.
 */
export async function registrarSimulacao(empresaId: string, entrada: EntradaGuardada, resultado: Resultado) {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("simulacoes").insert({
    empresa_id: empresaId,
    entrada,
    resultado,
    regras_versao: resultado.regrasVersao,
  });
  if (error) throw new Error(`[simulacoes] registrar: ${error.message}`);
}

export async function ultimaSimulacao(empresaId: string): Promise<Simulacao | null> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("simulacoes")
    .select("id, entrada, resultado, regras_versao, criada_em")
    .eq("empresa_id", empresaId)
    .order("criada_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[simulacoes] ler: ${error.message}`);
  return data as Simulacao | null;
}
