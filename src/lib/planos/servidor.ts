import "server-only";
import { clienteServico } from "@/lib/db/servico";
import type { Plano } from "./regras";

/** Plano ativo da pessoa. Sem assinatura válida, é o gratuito. */
export async function planoDe(perfilId: string, agora = new Date()): Promise<Plano> {
  const { data, error } = await clienteServico()
    .from("assinaturas")
    .select("plano, valido_ate")
    .eq("perfil_id", perfilId)
    .eq("status", "ativa");
  if (error) throw new Error(`[planos] plano: ${error.message}`);

  const hoje = agora.toISOString().slice(0, 10);
  const validas = (data ?? []).filter((a) => !a.valido_ate || a.valido_ate >= hoje).map((a) => a.plano as Plano);
  if (validas.includes("assessoria")) return "assessoria";
  if (validas.includes("pago")) return "pago";
  return "gratuito";
}
