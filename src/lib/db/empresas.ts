import "server-only";
import { criarClienteServidor } from "@/lib/db/servidor";
import type { DadosEmpresa } from "@/lib/validacao/empresa";
import type { EmpresaReceita } from "@/lib/integracoes/brasilapi";

export type Empresa = {
  id: string;
  cnpj: string | null;
  nome: string;
  razao_social: string | null;
  porte: string | null;
  regime: string | null;
  atividade: string;
  clientes: string | null;
  funcionarios: number | null;
  municipio: string | null;
  uf: string | null;
};

/** Empresas que o usuário logado enxerga. Quem filtra é a RLS, não este código. */
export async function empresasDoUsuario(): Promise<Empresa[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("empresas")
    .select("id, cnpj, nome, razao_social, porte, regime, atividade, clientes, funcionarios, municipio, uf")
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type ResultadoCriacao =
  | { ok: true; id: string }
  | { ok: false; motivo: "cnpj_repetido" | "falha" };

/**
 * Cria a empresa. O gatilho do banco torna quem criou o dono dela.
 *
 * O id é gerado AQUI, e o insert não pede os dados de volta (.select()).
 * Motivo: no momento do insert a pessoa ainda não é membro — o vínculo é
 * criado pelo gatilho logo depois —, então a RLS recusaria devolver a linha.
 */
export async function criarEmpresa(
  criadoPor: string,
  dados: DadosEmpresa,
  receita: EmpresaReceita | null,
): Promise<ResultadoCriacao> {
  const supabase = await criarClienteServidor();
  const id = crypto.randomUUID();

  const { error } = await supabase.from("empresas").insert({
    id,
    criado_por: criadoPor,
    cnpj: dados.cnpj || null,
    nome: dados.nome,
    atividade: dados.atividade,
    clientes: dados.clientes,
    funcionarios: dados.funcionarios,
    // Dados da Receita só entram se a consulta foi do MESMO CNPJ salvo.
    razao_social: receita?.razaoSocial ?? null,
    nome_fantasia: receita?.nomeFantasia ?? null,
    porte: receita?.porte || null,
    cnae_codigo: receita?.cnae?.codigo ?? null,
    cnae_descricao: receita?.cnae?.descricao ?? null,
    regime: receita && receita.regime.tipo !== "desconhecido" ? receita.regime.tipo : null,
    municipio: receita?.municipio ?? null,
    uf: receita?.uf ?? null,
    abertura: receita?.abertura ?? null,
  });

  if (!error) return { ok: true, id };
  if (error.code === "23505") return { ok: false, motivo: "cnpj_repetido" };
  console.error("[empresas] criar:", error.message);
  return { ok: false, motivo: "falha" };
}
