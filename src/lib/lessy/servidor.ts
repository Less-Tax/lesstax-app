import "server-only";
import { criarClienteServidor } from "@/lib/db/servidor";
import { clienteServico } from "@/lib/db/servico";
import type { MensagemHistorico } from "./contexto";
import { inicioDoDia, inicioDoMes, type Plano } from "./limites";

// ---------------------------------------------------------------- plano e uso

/** Plano ativo da pessoa. Sem assinatura válida, é o gratuito. */
export async function planoDe(perfilId: string, agora = new Date()): Promise<Plano> {
  const { data, error } = await clienteServico()
    .from("assinaturas")
    .select("plano, valido_ate")
    .eq("perfil_id", perfilId)
    .eq("status", "ativa");
  if (error) throw new Error(`[lessy] plano: ${error.message}`);

  const hoje = agora.toISOString().slice(0, 10);
  const validas = (data ?? []).filter((a) => !a.valido_ate || a.valido_ate >= hoje).map((a) => a.plano as Plano);
  if (validas.includes("assessoria")) return "assessoria";
  if (validas.includes("pago")) return "pago";
  return "gratuito";
}

/** Perguntas que a pessoa já fez neste mês (horário de Brasília). */
export async function usoDoMes(perfilId: string, agora = new Date()) {
  const { count, error } = await clienteServico()
    .from("mensagens")
    .select("id, conversas!inner(perfil_id)", { count: "exact", head: true })
    .eq("papel", "user")
    .eq("conversas.perfil_id", perfilId)
    .gte("criada_em", inicioDoMes(agora));
  if (error) throw new Error(`[lessy] uso do mês: ${error.message}`);
  return count ?? 0;
}

/** Perguntas de todo mundo hoje. */
export async function usoDoDia(agora = new Date()) {
  const { count, error } = await clienteServico()
    .from("mensagens")
    .select("id", { count: "exact", head: true })
    .eq("papel", "user")
    .gte("criada_em", inicioDoDia(agora));
  if (error) throw new Error(`[lessy] uso do dia: ${error.message}`);
  return count ?? 0;
}

// ---------------------------------------------------------------- conversas (leitura pela RLS)

export type Mensagem = MensagemHistorico & { id: string };

/**
 * A conversa a abrir: a pedida (se for desta pessoa e empresa) ou a mais
 * recente. Vem com as mensagens.
 */
export async function conversaParaAbrir(empresaId: string, perfilId: string, pedida?: string | null) {
  let id: string | null = null;
  if (pedida && /^[0-9a-f-]{36}$/i.test(pedida)) id = await conversaDoUsuario(pedida, empresaId, perfilId);

  if (!id) {
    const supabase = await criarClienteServidor();
    const { data, error } = await supabase
      .from("conversas")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("perfil_id", perfilId)
      .order("criada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`[lessy] conversa: ${error.message}`);
    id = (data?.id as string | undefined) ?? null;
  }
  return id ? { id, mensagens: await mensagensDa(id) } : null;
}

export type ResumoConversa = { id: string; titulo: string; criadaEm: string };

/** As últimas conversas da pessoa, com a primeira pergunta como título. */
export async function conversasDe(empresaId: string, perfilId: string, limite = 20): Promise<ResumoConversa[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("conversas")
    .select("id, criada_em, mensagens(conteudo, papel, criada_em)")
    .eq("empresa_id", empresaId)
    .eq("perfil_id", perfilId)
    .eq("mensagens.papel", "user")
    .order("criada_em", { ascending: false })
    .order("criada_em", { referencedTable: "mensagens", ascending: true })
    .limit(1, { referencedTable: "mensagens" })
    .limit(limite);
  if (error) throw new Error(`[lessy] conversas: ${error.message}`);
  return (data ?? [])
    .map((c) => {
      const primeira = (c.mensagens as { conteudo: string }[] | null)?.[0]?.conteudo ?? "";
      return { id: c.id as string, titulo: primeira.slice(0, 80), criadaEm: c.criada_em as string };
    })
    .filter((c) => c.titulo);
}

/**
 * A conversa só vale se for desta empresa E desta pessoa. A leitura passa pela
 * RLS (a empresa tem de ser do usuário); a pessoa é conferida aqui.
 */
export async function conversaDoUsuario(conversaId: string, empresaId: string, perfilId: string) {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("conversas")
    .select("id, empresa_id, perfil_id")
    .eq("id", conversaId)
    .maybeSingle();
  if (error) throw new Error(`[lessy] conversa: ${error.message}`);
  if (!data || data.empresa_id !== empresaId || data.perfil_id !== perfilId) return null;
  return data.id as string;
}

export async function mensagensDa(conversaId: string): Promise<Mensagem[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("mensagens")
    .select("id, papel, conteudo")
    .eq("conversa_id", conversaId)
    .order("criada_em", { ascending: true })
    .limit(100);
  if (error) throw new Error(`[lessy] mensagens: ${error.message}`);
  return (data ?? []).map((m) => ({ id: m.id, papel: m.papel, conteudo: m.conteudo }));
}

// ---------------------------------------------------------------- gravação (chave de serviço)

/**
 * Grava a pergunta e a resposta juntas — só depois que a Lessy respondeu,
 * para uma falha da API não gastar pergunta. Cria a conversa se preciso.
 * Quem chama já conferiu login, empresa, dono da conversa e limite.
 */
export async function gravarTroca(t: {
  conversaId: string | null;
  empresaId: string;
  perfilId: string;
  pergunta: string;
  resposta: string;
  tokensEntrada: number | null;
  tokensSaida: number | null;
}) {
  const db = clienteServico();
  let conversaId = t.conversaId;
  if (!conversaId) {
    conversaId = crypto.randomUUID();
    const { error } = await db.from("conversas").insert({ id: conversaId, empresa_id: t.empresaId, perfil_id: t.perfilId });
    if (error) throw new Error(`[lessy] criar conversa: ${error.message}`);
  }

  const agora = Date.now();
  const { error } = await db.from("mensagens").insert([
    { conversa_id: conversaId, papel: "user", conteudo: t.pergunta, criada_em: new Date(agora).toISOString() },
    {
      conversa_id: conversaId,
      papel: "assistant",
      conteudo: t.resposta,
      tokens_entrada: t.tokensEntrada,
      tokens_saida: t.tokensSaida,
      // 1 ms depois, para a ordem ficar certa
      criada_em: new Date(agora + 1).toISOString(),
    },
  ]);
  if (error) throw new Error(`[lessy] gravar: ${error.message}`);
  return conversaId;
}

// ---------------------------------------------------------------- API da Anthropic

export type RespostaClaude =
  | { ok: true; texto: string; tokensEntrada: number | null; tokensSaida: number | null }
  | { ok: false; motivo: "sem_chave" | "falha" };

/** Chama a API de mensagens. A chave fica só no servidor. */
export async function perguntarAoClaude(
  sistema: string,
  mensagens: { role: "user" | "assistant"; content: string }[],
): Promise<RespostaClaude> {
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) return { ok: false, motivo: "sem_chave" };

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.LESSY_MODEL || "claude-sonnet-5",
        max_tokens: 500,
        system: sistema,
        messages: mensagens,
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    if (!resposta.ok) {
      console.error("[lessy] anthropic", resposta.status, (await resposta.text().catch(() => "")).slice(0, 500));
      return { ok: false, motivo: "falha" };
    }
    const dados = (await resposta.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const texto = (dados.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n")
      .trim();
    if (!texto) return { ok: false, motivo: "falha" };
    return { ok: true, texto, tokensEntrada: dados.usage?.input_tokens ?? null, tokensSaida: dados.usage?.output_tokens ?? null };
  } catch (erro) {
    console.error("[lessy] anthropic", erro instanceof Error ? erro.message : erro);
    return { ok: false, motivo: "falha" };
  }
}
