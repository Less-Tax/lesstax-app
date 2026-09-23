/**
 * Preenche uma conta de TESTE com meses de exemplo, para ver as telas cheias.
 *
 *   npx tsx scripts/popular-dev.ts            (usa a única empresa do banco dev)
 *   npx tsx scripts/popular-dev.ts email@x    (escolhe a conta pelo e-mail)
 *
 * - Só roda no projeto lesstax-dev: recusa qualquer outro endereço.
 * - Nunca apaga nem sobrescreve meses já lançados: só preenche os que faltam.
 * - Depois recalcula a simulação de todos os meses, em ordem, com a receita
 *   de 12 meses correta.
 * Usa a SUPABASE_SERVICE_ROLE_KEY do .env.local (ignora a RLS) — por isso a trava.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { calcular, historico12, type Atividade } from "../src/lib/tributario";

const PROJETOS_DE_TESTE = ["nyfwkayehxqywdajgkjz"]; // lesstax-dev

// ---- .env.local (sem dependência nova)
const env: Record<string, string> = {};
for (const linha of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(linha);
  if (m) env[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local.");
if (!PROJETOS_DE_TESTE.some((ref) => url.includes(ref))) {
  throw new Error(`Recusado: ${url} não é o projeto de teste. Este script só roda no lesstax-dev.`);
}
const db = createClient(url, chave, { auth: { persistSession: false } });

// ---- números de exemplo: tendência de alta, dezembro forte, começo de ano fraco
let semente = 7;
const sorte = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
const SAZONAL = [0.82, 0.86, 0.95, 0.97, 1.0, 0.98, 1.02, 1.0, 1.03, 1.06, 1.12, 1.35];

async function main() {
  const emailPedido = process.argv[2]?.toLowerCase();

  const { data: empresas, error: e1 } = await db.from("empresas").select("id, nome, atividade, criado_por");
  if (e1) throw e1;
  if (!empresas?.length) throw new Error("Nenhuma empresa no banco de teste. Cadastre uma pelo app primeiro.");

  const { data: usuarios, error: e2 } = await db.auth.admin.listUsers({ perPage: 200 });
  if (e2) throw e2;
  const emailDe = new Map(usuarios.users.map((u) => [u.id, u.email?.toLowerCase() ?? ""]));

  const candidatas = emailPedido ? empresas.filter((e) => emailDe.get(e.criado_por) === emailPedido) : empresas;
  if (candidatas.length !== 1) {
    console.log("Diga qual conta preencher. Empresas no banco de teste:");
    for (const e of empresas) console.log(`  ${emailDe.get(e.criado_por)}  →  ${e.nome}`);
    console.log("\nUso: npx tsx scripts/popular-dev.ts <email>");
    process.exit(1);
  }
  const empresa = candidatas[0];
  const atividade = empresa.atividade as Atividade;

  const { data: existentes, error: e3 } = await db
    .from("meses")
    .select("ano, mes, faturamento, folha, custos, monofasico")
    .eq("empresa_id", empresa.id);
  if (e3) throw e3;
  const jaTem = new Set(existentes!.map((m) => m.ano * 12 + m.mes - 1));

  // Base: o mês lançado mais recente, ou valores padrão.
  const recente = [...existentes!].sort((a, b) => b.ano * 12 + b.mes - (a.ano * 12 + a.mes))[0];
  const base = {
    faturamento: Number(recente?.faturamento ?? 60_000),
    folha: Number(recente?.folha ?? 15_000),
    custos: Number(recente?.custos ?? 22_000),
  };

  // De janeiro do ano passado até o último mês fechado (horário de Brasília).
  const [anoHoje, mesHoje] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
    .split("-")
    .map(Number);
  const fim = anoHoje * 12 + mesHoje - 2;
  const inicio = (anoHoje - 1) * 12;

  const novos = [];
  for (let i = inicio; i <= fim; i++) {
    if (jaTem.has(i)) continue;
    const ano = Math.floor(i / 12);
    const mes = (i % 12) + 1;
    const tendencia = 1 - (fim - i) * 0.012; // ~1,2% de crescimento por mês
    const ruido = 0.94 + sorte() * 0.12;
    const faturamento = Math.round((base.faturamento * SAZONAL[mes - 1] * tendencia * ruido) / 100) * 100;
    const folha = Math.round((base.folha * (0.97 + sorte() * 0.06) * (mes === 12 ? 1.4 : 1)) / 100) * 100; // 13º
    const custos = Math.round((base.custos * (faturamento / base.faturamento) * (0.92 + sorte() * 0.16)) / 100) * 100;
    const monofasico = atividade === "comercio" ? Number(recente?.monofasico ?? 0.2) : 0;
    novos.push({ empresa_id: empresa.id, ano, mes, faturamento, folha, custos, monofasico });
  }

  if (novos.length) {
    const { error } = await db.from("meses").insert(novos);
    if (error) throw error;
  }

  // Recalcula todos os meses, em ordem, com a receita de 12 meses de verdade.
  const { data: todos, error: e4 } = await db
    .from("meses")
    .select("ano, mes, faturamento, folha, custos, monofasico")
    .eq("empresa_id", empresa.id)
    .order("ano")
    .order("mes");
  if (e4) throw e4;
  const meses = todos!.map((m) => ({
    ano: m.ano,
    mes: m.mes,
    faturamento: Number(m.faturamento),
    folha: Number(m.folha),
    custos: Number(m.custos),
    monofasico: Number(m.monofasico),
  }));
  const simulacoes = meses.map((m) => {
    const entrada = { atividade, faturamento: m.faturamento, folha: m.folha, custos: m.custos, monofasico: m.monofasico };
    const resultado = calcular(entrada, undefined, historico12(meses, m));
    return {
      empresa_id: empresa.id,
      entrada: { ...entrada, ano: m.ano, mes: m.mes },
      resultado,
      regras_versao: resultado.regrasVersao,
    };
  });
  const { error: e5 } = await db.from("simulacoes").insert(simulacoes);
  if (e5) throw e5;

  console.log(`Empresa: ${empresa.nome} (${emailDe.get(empresa.criado_por)})`);
  console.log(`Meses que já existiam, mantidos: ${existentes!.length}`);
  console.log(`Meses de exemplo criados: ${novos.length}`);
  console.log(`Simulações recalculadas: ${simulacoes.length}`);
  for (const s of simulacoes.slice(-6)) {
    const r = s.resultado;
    console.log(
      `  ${String(s.entrada.mes).padStart(2, "0")}/${s.entrada.ano}  entrou ${s.entrada.faturamento.toLocaleString("pt-BR")}` +
        `  imposto ${r.imposto.toLocaleString("pt-BR")}  lucro ${r.lucro.toLocaleString("pt-BR")}  (12 meses: ${r.origemRbt12.tipo})`,
    );
  }
}

main().catch((erro) => {
  console.error(erro.message ?? erro);
  process.exit(1);
});
