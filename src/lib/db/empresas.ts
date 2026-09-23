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
  cnae_descricao: string | null;
  /** Preenchido só pela equipe, depois de confirmar que a conta é da empresa. */
  verificada_em: string | null;
  /** Preenchido quando o CNPJ foi confirmado por outra conta e removido desta. */
  cnpj_removido_em: string | null;
};

/** Empresas que o usuário logado enxerga. Quem filtra é a RLS, não este código. */
export async function empresasDoUsuario(): Promise<Empresa[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("empresas")
    .select("id, cnpj, nome, razao_social, porte, regime, atividade, clientes, funcionarios, municipio, uf, cnae_descricao, verificada_em, cnpj_removido_em")
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type ResultadoCriacao =
  | { ok: true; id: string }
  | { ok: false; motivo: "cnpj_verificado" | "falha" };

/** Colunas que vêm da Receita. Sem consulta (ou sem CNPJ), todas voltam a null. */
function colunasReceita(receita: EmpresaReceita | null) {
  return {
    razao_social: receita?.razaoSocial ?? null,
    nome_fantasia: receita?.nomeFantasia ?? null,
    porte: receita?.porte || null,
    cnae_codigo: receita?.cnae?.codigo ?? null,
    cnae_descricao: receita?.cnae?.descricao ?? null,
    regime: receita && receita.regime.tipo !== "desconhecido" ? receita.regime.tipo : null,
    municipio: receita?.municipio ?? null,
    uf: receita?.uf ?? null,
    abertura: receita?.abertura ?? null,
  };
}

/**
 * Cria a empresa, sempre como NÃO verificada. O gatilho do banco torna quem
 * criou o dono dela. O mesmo CNPJ pode existir em várias contas enquanto
 * nenhuma for verificada. Depois que uma é verificada, o CNPJ é só dela.
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
    ...colunasReceita(receita),
  });

  if (!error) return { ok: true, id };
  // O banco recusa CNPJ que já foi verificado por outra conta.
  if (error.hint === "cnpj_ja_verificado") return { ok: false, motivo: "cnpj_verificado" };
  console.error("[empresas] criar:", error.message);
  return { ok: false, motivo: "falha" };
}

export type ResultadoEdicao = { ok: true } | { ok: false; motivo: "cnpj_verificado" | "falha" };

/**
 * Atualiza a empresa. `receita` diz o que fazer com os dados da Receita:
 * "manter" quando o CNPJ não mudou; a consulta nova quando mudou; null
 * quando o CNPJ foi apagado ou a consulta falhou.
 * Quem pode editar é a RLS (membro da empresa). Trocar o CNPJ de uma
 * empresa verificada é barrado pelo banco.
 */
export async function atualizarEmpresa(
  id: string,
  dados: DadosEmpresa,
  receita: EmpresaReceita | null | "manter",
): Promise<ResultadoEdicao> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("empresas")
    .update({
      nome: dados.nome,
      atividade: dados.atividade,
      clientes: dados.clientes,
      funcionarios: dados.funcionarios,
      ...(receita === "manter"
        ? {}
        : {
            cnpj: dados.cnpj || null,
            ...colunasReceita(receita),
            // CNPJ novo: o aviso de "CNPJ removido" deixa de valer.
            ...(dados.cnpj ? { cnpj_removido_em: null } : {}),
          }),
    })
    .eq("id", id);

  if (!error) return { ok: true };
  if (error.hint === "cnpj_ja_verificado") return { ok: false, motivo: "cnpj_verificado" };
  console.error("[empresas] atualizar:", error.message);
  return { ok: false, motivo: "falha" };
}
