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

/**
 * A simulação mais recente de cada mês, do mais antigo para o mais novo.
 * Um mês relançado tem várias simulações; vale a última.
 */
export async function simulacoesPorMes(empresaId: string): Promise<Simulacao[]> {
  const supabase = await criarClienteServidor();
  const [{ data, error }, lancados] = await Promise.all([
    supabase
      .from("simulacoes")
      .select("id, entrada, resultado, regras_versao, criada_em")
      .eq("empresa_id", empresaId)
      .order("criada_em", { ascending: false })
      .limit(500),
    supabase.from("meses").select("ano, mes").eq("empresa_id", empresaId),
  ]);
  if (error) throw new Error(`[simulacoes] listar: ${error.message}`);
  if (lancados.error) throw new Error(`[simulacoes] meses: ${lancados.error.message}`);

  // Mês apagado some da tela; as simulações dele ficam guardadas no histórico.
  const existe = new Set((lancados.data ?? []).map((m) => `${m.ano}-${m.mes}`));
  const porMes = new Map<string, Simulacao>();
  for (const s of (data ?? []) as Simulacao[]) {
    const chave = `${s.entrada.ano}-${s.entrada.mes}`;
    if (!existe.has(chave)) continue;
    if (!porMes.has(chave)) porMes.set(chave, s); // a primeira é a mais nova
  }
  return [...porMes.values()].sort(
    (a, b) => a.entrada.ano * 12 + a.entrada.mes - (b.entrada.ano * 12 + b.entrada.mes),
  );
}

/** Várias simulações de uma vez (um único insert). */
export async function registrarSimulacoes(
  empresaId: string,
  lista: { entrada: EntradaGuardada; resultado: Resultado }[],
) {
  if (lista.length === 0) return;
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("simulacoes").insert(
    lista.map(({ entrada, resultado }) => ({
      empresa_id: empresaId,
      entrada,
      resultado,
      regras_versao: resultado.regrasVersao,
    })),
  );
  if (error) throw new Error(`[simulacoes] registrar: ${error.message}`);
}
