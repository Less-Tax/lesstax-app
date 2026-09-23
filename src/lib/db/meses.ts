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
