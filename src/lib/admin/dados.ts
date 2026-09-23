import "server-only";
import { clienteServico } from "@/lib/db/servico";

/** A chave de serviço ignora a RLS: só chamar depois de exigirAdmin(). */
const clienteAdmin = clienteServico;

// ---------------------------------------------------------------- usuários

export type UsuarioAdmin = {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  criadoEm: string;
  ultimoAcesso: string | null;
  confirmado: boolean;
  /** Premium ativo agora (e até quando; null = sem prazo). */
  premium: { ate: string | null } | null;
};

/** Todos os usuários (até 1.000 — sobra para a fase de 500). */
async function todosUsuarios(): Promise<UsuarioAdmin[]> {
  const db = clienteAdmin();
  const hoje = new Date().toISOString().slice(0, 10);
  const [{ data, error }, perfis, assinaturas] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("perfis").select("id, nome, telefone"),
    db.from("assinaturas").select("perfil_id, plano, valido_ate").eq("status", "ativa").in("plano", ["pago", "assessoria"]),
  ]);
  if (error) throw new Error(`[admin] usuários: ${error.message}`);
  if (perfis.error) throw new Error(`[admin] perfis: ${perfis.error.message}`);
  if (assinaturas.error) throw new Error(`[admin] assinaturas: ${assinaturas.error.message}`);

  const premiumDe = new Map<string, { ate: string | null }>();
  for (const a of assinaturas.data ?? []) {
    if (a.valido_ate && a.valido_ate < hoje) continue;
    premiumDe.set(a.perfil_id as string, { ate: (a.valido_ate as string | null) ?? null });
  }

  const porId = new Map((perfis.data ?? []).map((p) => [p.id as string, p]));
  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      nome: (porId.get(u.id)?.nome as string | null) ?? null,
      telefone: (porId.get(u.id)?.telefone as string | null) ?? null,
      criadoEm: u.created_at,
      ultimoAcesso: u.last_sign_in_at ?? null,
      confirmado: !!u.email_confirmed_at,
      premium: premiumDe.get(u.id) ?? null,
    }))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

// ---------------------------------------------------------------- empresas

export type EmpresaAdmin = {
  id: string;
  nome: string;
  cnpj: string | null;
  razaoSocial: string | null;
  atividade: string;
  municipio: string | null;
  uf: string | null;
  criadaEm: string;
  verificadaEm: string | null;
  verificadaPor: string | null;
  metodo: string | null;
  cnpjRemovidoEm: string | null;
  meses: number;
  donos: { id: string; email: string; nome: string | null }[];
  /** Outras empresas não verificadas com o mesmo CNPJ (perdem o CNPJ se esta for verificada). */
  copias: number;
};

type LinhaEmpresa = {
  id: string;
  nome: string;
  cnpj: string | null;
  razao_social: string | null;
  atividade: string;
  municipio: string | null;
  uf: string | null;
  criado_em: string;
  verificada_em: string | null;
  verificada_por: string | null;
  verificacao_metodo: string | null;
  cnpj_removido_em: string | null;
  membros: { perfil_id: string; papel: string; ativo: boolean }[];
  meses: { count: number }[];
};

async function todasEmpresas(usuarios?: UsuarioAdmin[]): Promise<EmpresaAdmin[]> {
  const db = clienteAdmin();
  const [{ data, error }, lista] = await Promise.all([
    db
      .from("empresas")
      .select(
        "id, nome, cnpj, razao_social, atividade, municipio, uf, criado_em, verificada_em, verificada_por, verificacao_metodo, cnpj_removido_em, membros(perfil_id, papel, ativo), meses(count)",
      )
      .order("criado_em", { ascending: false })
      .limit(1000),
    usuarios ? Promise.resolve(usuarios) : todosUsuarios(),
  ]);
  if (error) throw new Error(`[admin] empresas: ${error.message}`);

  const linhas = (data ?? []) as unknown as LinhaEmpresa[];
  const usuarioPorId = new Map(lista.map((u) => [u.id, u]));
  const porCnpj = new Map<string, number>();
  for (const e of linhas) if (e.cnpj) porCnpj.set(e.cnpj, (porCnpj.get(e.cnpj) ?? 0) + 1);

  return linhas.map((e) => ({
    id: e.id,
    nome: e.nome,
    cnpj: e.cnpj,
    razaoSocial: e.razao_social,
    atividade: e.atividade,
    municipio: e.municipio,
    uf: e.uf,
    criadaEm: e.criado_em,
    verificadaEm: e.verificada_em,
    verificadaPor: e.verificada_por,
    metodo: e.verificacao_metodo,
    cnpjRemovidoEm: e.cnpj_removido_em,
    meses: e.meses?.[0]?.count ?? 0,
    donos: e.membros
      .filter((m) => m.ativo && m.papel === "dono")
      .map((m) => {
        const u = usuarioPorId.get(m.perfil_id);
        return { id: m.perfil_id, email: u?.email ?? "—", nome: u?.nome ?? null };
      }),
    copias: e.cnpj ? (porCnpj.get(e.cnpj) ?? 1) - 1 : 0,
  }));
}

export type FiltroEmpresas = "pendentes" | "verificadas" | "todas";

/** "Pendentes": têm CNPJ e ainda não foram verificadas — é a fila de trabalho. */
export async function listarEmpresas(filtro: FiltroEmpresas, busca = "") {
  const empresas = await todasEmpresas();
  const termo = busca.trim().toLowerCase();
  const digitos = termo.replace(/\D/g, "");

  return empresas.filter((e) => {
    if (filtro === "pendentes" && (e.verificadaEm || !e.cnpj)) return false;
    if (filtro === "verificadas" && !e.verificadaEm) return false;
    if (!termo) return true;
    return (
      e.nome.toLowerCase().includes(termo) ||
      (e.razaoSocial ?? "").toLowerCase().includes(termo) ||
      (digitos.length >= 3 && (e.cnpj ?? "").includes(digitos)) ||
      e.donos.some((d) => d.email.toLowerCase().includes(termo))
    );
  });
}

export async function listarUsuarios(busca = "") {
  const [usuarios, empresas] = await Promise.all([todosUsuarios(), todasEmpresas()]);
  const empresasDe = new Map<string, string[]>();
  for (const e of empresas) for (const d of e.donos) empresasDe.set(d.id, [...(empresasDe.get(d.id) ?? []), e.nome]);

  const termo = busca.trim().toLowerCase();
  return usuarios
    .map((u) => ({ ...u, empresas: empresasDe.get(u.id) ?? [] }))
    .filter(
      (u) =>
        !termo ||
        u.email.toLowerCase().includes(termo) ||
        (u.nome ?? "").toLowerCase().includes(termo) ||
        u.empresas.some((n) => n.toLowerCase().includes(termo)),
    );
}

// ---------------------------------------------------------------- leads

export type LeadAdmin = {
  id: number;
  criadoEm: string;
  nome: string;
  whatsapp: string;
  empresa: string | null;
  atividade: string | null;
  faturamentoMes: number | null;
  origem: string | null;
};

export async function listarLeads(limite = 200): Promise<LeadAdmin[]> {
  const { data, error } = await clienteAdmin()
    .from("leads")
    .select("id, criado_em, nome, whatsapp, empresa, atividade, faturamento_mes, origem")
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`[admin] leads: ${error.message}`);
  return (data ?? []).map((l) => ({
    id: l.id,
    criadoEm: l.criado_em,
    nome: l.nome,
    whatsapp: l.whatsapp,
    empresa: l.empresa,
    atividade: l.atividade,
    faturamentoMes: l.faturamento_mes === null ? null : Number(l.faturamento_mes),
    origem: l.origem,
  }));
}

// ---------------------------------------------------------------- resumo

export async function resumo() {
  const db = clienteAdmin();
  const seteDias = new Date(Date.now() - 7 * 864e5).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- o tipo do filtro do supabase-js é longo demais para repetir aqui
  const contar = async (tabela: string, filtro?: (q: any) => any) => {
    let q = db.from(tabela).select("*", { count: "exact", head: true });
    if (filtro) q = filtro(q);
    const { count, error } = await q;
    if (error) throw new Error(`[admin] contar ${tabela}: ${error.message}`);
    return count ?? 0;
  };

  const [usuarios, empresas, verificadas, pendentes, meses, leads, leads7] = await Promise.all([
    todosUsuarios(),
    contar("empresas"),
    contar("empresas", (q) => q.not("verificada_em", "is", null)),
    contar("empresas", (q) => q.is("verificada_em", null).not("cnpj", "is", null)),
    contar("meses"),
    contar("leads"),
    contar("leads", (q) => q.gte("criado_em", seteDias)),
  ]);

  return {
    usuarios: usuarios.length,
    usuarios7: usuarios.filter((u) => u.criadoEm >= seteDias).length,
    empresas,
    verificadas,
    pendentes,
    meses,
    leads,
    leads7,
  };
}

// ---------------------------------------------------------------- eventos

export type EventoAdmin = { id: number; acao: string; criadoEm: string; empresa: string | null; detalhe: Record<string, unknown> | null };

export async function ultimosEventos(limite = 20): Promise<EventoAdmin[]> {
  const { data, error } = await clienteAdmin()
    .from("eventos")
    .select("id, acao, criado_em, detalhe, empresas(nome)")
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`[admin] eventos: ${error.message}`);
  return (data ?? []).map((e) => ({
    id: e.id,
    acao: e.acao,
    criadoEm: e.criado_em,
    empresa: (e.empresas as unknown as { nome: string } | null)?.nome ?? null,
    detalhe: e.detalhe as Record<string, unknown> | null,
  }));
}

// ---------------------------------------------------------------- ações

export type MetodoVerificacao = "manual" | "cpf" | "pix";

/**
 * Verifica a empresa pela função do banco (que também tira o CNPJ das cópias)
 * e registra quem fez, na trilha de eventos.
 */
export async function verificarEmpresa(empresaId: string, admin: { id: string; email: string }, metodo: MetodoVerificacao) {
  const db = clienteAdmin();
  const { error } = await db.rpc("verificar_empresa", { p_empresa: empresaId, p_por: admin.email, p_metodo: metodo });
  if (error) throw new Error(`[admin] verificar: ${error.message}`);
  await registrarEvento(admin.id, empresaId, "empresa_verificada", { por: admin.email, metodo });
}

export async function desfazerVerificacao(empresaId: string, admin: { id: string; email: string }) {
  const db = clienteAdmin();
  const { error } = await db.rpc("desfazer_verificacao", { p_empresa: empresaId });
  if (error) throw new Error(`[admin] desfazer: ${error.message}`);
  await registrarEvento(admin.id, empresaId, "verificacao_desfeita", { por: admin.email });
}

async function registrarEvento(perfilId: string, empresaId: string, acao: string, detalhe: Record<string, unknown>) {
  const { error } = await clienteAdmin()
    .from("eventos")
    .insert({ perfil_id: perfilId, empresa_id: empresaId, acao, detalhe });
  // A ação já aconteceu; falhar o registro não deve desfazê-la. Só avisa no log.
  if (error) console.error("[admin] evento:", error.message);
}

// ---------------------------------------------------------------- planos

/**
 * Ativa o Premium na mão (enquanto não há cobrança automática).
 * `dias` = null → sem prazo. Cancela antes qualquer assinatura ativa da pessoa,
 * para existir só uma.
 */
export async function ativarPremium(perfilId: string, admin: { id: string; email: string }, dias: number | null) {
  const db = clienteAdmin();
  const cancelar = await db.from("assinaturas").update({ status: "cancelada" }).eq("perfil_id", perfilId).eq("status", "ativa");
  if (cancelar.error) throw new Error(`[admin] cancelar anterior: ${cancelar.error.message}`);

  const ate = dias ? new Date(Date.now() + dias * 864e5).toISOString().slice(0, 10) : null;
  const { error } = await db.from("assinaturas").insert({ perfil_id: perfilId, plano: "pago", status: "ativa", valido_ate: ate });
  if (error) throw new Error(`[admin] ativar premium: ${error.message}`);
  await registrarEventoPerfil(admin.id, "premium_ativado", { por: admin.email, para: perfilId, ate });
}

export async function desativarPremium(perfilId: string, admin: { id: string; email: string }) {
  const { error } = await clienteAdmin()
    .from("assinaturas")
    .update({ status: "cancelada" })
    .eq("perfil_id", perfilId)
    .eq("status", "ativa");
  if (error) throw new Error(`[admin] desativar premium: ${error.message}`);
  await registrarEventoPerfil(admin.id, "premium_desativado", { por: admin.email, para: perfilId });
}

async function registrarEventoPerfil(adminId: string, acao: string, detalhe: Record<string, unknown>) {
  const { error } = await clienteAdmin().from("eventos").insert({ perfil_id: adminId, acao, detalhe });
  if (error) console.error("[admin] evento:", error.message);
}
