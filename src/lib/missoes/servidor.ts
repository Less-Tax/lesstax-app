import "server-only";
import { criarClienteServidor } from "@/lib/db/servidor";
import { mesesDaEmpresa } from "@/lib/db/meses";
import { missoes, type Missao } from "./regras";

/** Tudo o que a lista de missões precisa, lido pela RLS (só a empresa do usuário). */
export async function missoesDa(empresa: { id: string; atividade: string }, agora = new Date()): Promise<Missao[]> {
  const supabase = await criarClienteServidor();
  const [meses, marcadas, perguntas] = await Promise.all([
    mesesDaEmpresa(empresa.id),
    supabase.from("missoes_feitas").select("missao, referencia").eq("empresa_id", empresa.id),
    supabase
      .from("mensagens")
      .select("id, conversas!inner(empresa_id)", { count: "exact", head: true })
      .eq("papel", "user")
      .eq("conversas.empresa_id", empresa.id),
  ]);
  if (marcadas.error) throw new Error(`[missoes] marcadas: ${marcadas.error.message}`);
  if (perguntas.error) throw new Error(`[missoes] lessy: ${perguntas.error.message}`);

  const chaves = new Set((marcadas.data ?? []).map((m) => `${m.missao}:${m.referencia}`));
  return missoes({
    atividade: empresa.atividade,
    lancados: meses,
    marcadas: chaves,
    perguntouAoLessy: (perguntas.count ?? 0) > 0,
    pediuEspecialista: chaves.has("especialista:sempre"),
    agora,
  });
}
