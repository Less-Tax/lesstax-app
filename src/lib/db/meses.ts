import "server-only";
import { criarClienteServidor } from "@/lib/db/servidor";
import type { DadosMes } from "@/lib/validacao/mes";

/**
 * Grava o mês. Se a empresa já lançou essa competência, atualiza.
 * Quem pode gravar em qual empresa é decidido pela RLS (e_membro).
 */
export async function salvarMes(empresaId: string, dados: DadosMes) {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("meses").upsert(
    {
      empresa_id: empresaId,
      ano: dados.ano,
      mes: dados.mes,
      faturamento: dados.faturamento,
      folha: dados.folha,
      custos: dados.custos,
      monofasico: dados.monofasico,
    },
    { onConflict: "empresa_id,ano,mes" },
  );
  if (error) throw new Error(`[meses] salvar: ${error.message}`);
}

export type Mes = {
  ano: number;
  mes: number;
  faturamento: number;
  folha: number;
  custos: number;
  monofasico: number;
};

/** Todos os meses lançados da empresa, do mais antigo para o mais novo. */
export async function mesesDaEmpresa(empresaId: string): Promise<Mes[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("meses")
    .select("ano, mes, faturamento, folha, custos, monofasico")
    .eq("empresa_id", empresaId)
    .order("ano", { ascending: true })
    .order("mes", { ascending: true });
  if (error) throw new Error(`[meses] listar: ${error.message}`);
  // O Postgres devolve numeric como texto; aqui vira número.
  return (data ?? []).map((m) => ({
    ano: m.ano,
    mes: m.mes,
    faturamento: Number(m.faturamento),
    folha: Number(m.folha),
    custos: Number(m.custos),
    monofasico: Number(m.monofasico),
  }));
}
