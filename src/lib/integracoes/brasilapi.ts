import "server-only";
import { cnpjValido, soDigitos } from "@/lib/validacao/cnpj";

/**
 * Consulta de CNPJ na BrasilAPI (gratuita, sem chave).
 * Roda só no servidor: a resposta da Receita traz os sócios, que não usamos
 * e não queremos no navegador. Daqui sai apenas o resumo abaixo.
 */

const ORIGEM = "https://brasilapi.com.br/api/cnpj/v1/";
const TIMEOUT_MS = 8_000;
const CACHE_MS = 24 * 60 * 60 * 1000;

export type Atividade = "comercio" | "industria" | "servicos" | "profissionais" | "obras";

export type Regime =
  | { tipo: "mei"; texto: string; desde: string | null }
  | { tipo: "simples"; texto: string; desde: string | null }
  | { tipo: "lucro_real" | "lucro_presumido" | "fora" | "desconhecido"; texto: string; desde: null };

export type EmpresaReceita = {
  cnpj: string;
  nome: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  porte: string;
  porteTexto: string;
  cnae: { codigo: number; descricao: string } | null;
  atividadeSugerida: Atividade | null;
  regime: Regime;
  municipio: string | null;
  uf: string | null;
  abertura: string | null;
  situacao: string | null;
};

export type ResultadoConsulta =
  | { ok: true; empresa: EmpresaReceita }
  | { ok: false; motivo: "invalido" | "nao_encontrado" | "indisponivel" };

const PORTE_TEXTO: Record<string, string> = {
  ME: "Microempresa",
  EPP: "Empresa de Pequeno Porte",
  DEMAIS: "Acima do porte EPP",
};

/**
 * CNAE → uma das cinco atividades do formulário, pela divisão (2 primeiros dígitos).
 * É um palpite para já deixar marcado; o usuário sempre pode corrigir.
 */
export function atividadePorCnae(codigo: number | null | undefined): Atividade | null {
  const divisao = Number(String(codigo ?? "").padStart(7, "0").slice(0, 2));
  if (!divisao) return null;
  if (divisao <= 3) return "comercio"; // agropecuária: vende produto
  if (divisao <= 33) return "industria"; // extrativa e transformação
  if (divisao >= 41 && divisao <= 43) return "obras"; // construção
  if (divisao === 80 || divisao === 81) return "obras"; // vigilância, limpeza de prédios
  if (divisao >= 45 && divisao <= 47) return "comercio";
  if (divisao >= 58 && divisao <= 66) return "profissionais"; // TI, comunicação, financeiro
  if (divisao >= 69 && divisao <= 75) return "profissionais"; // jurídico, contábil, consultoria, engenharia
  if (divisao === 86) return "profissionais"; // saúde humana
  return "servicos";
}

type RespostaBrasilApi = {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  porte?: string | null;
  cnae_fiscal?: number | null;
  cnae_fiscal_descricao?: string | null;
  opcao_pelo_mei?: boolean | null;
  opcao_pelo_simples?: boolean | null;
  data_opcao_pelo_mei?: string | null;
  data_opcao_pelo_simples?: string | null;
  data_exclusao_do_simples?: string | null;
  regime_tributario?: { ano: number; forma_de_tributacao: string }[] | null;
  municipio?: string | null;
  uf?: string | null;
  data_inicio_atividade?: string | null;
  descricao_situacao_cadastral?: string | null;
};

function regimeDe(d: RespostaBrasilApi): Regime {
  const anos = d.regime_tributario ?? [];
  const ultimo = anos.length ? anos[anos.length - 1] : null;
  if (d.opcao_pelo_mei) return { tipo: "mei", texto: "MEI", desde: d.data_opcao_pelo_mei ?? null };
  if (d.opcao_pelo_simples)
    return { tipo: "simples", texto: "Simples Nacional", desde: d.data_opcao_pelo_simples ?? null };
  if (ultimo && /REAL/i.test(ultimo.forma_de_tributacao))
    return { tipo: "lucro_real", texto: `Lucro Real (declarado em ${ultimo.ano})`, desde: null };
  if (ultimo && /PRESUMIDO/i.test(ultimo.forma_de_tributacao))
    return { tipo: "lucro_presumido", texto: `Lucro Presumido (declarado em ${ultimo.ano})`, desde: null };
  if (d.data_exclusao_do_simples)
    return { tipo: "fora", texto: `Saiu do Simples em ${d.data_exclusao_do_simples}`, desde: null };
  return { tipo: "desconhecido", texto: "", desde: null };
}

/** Só estes campos saem daqui. Sócios, e-mail e telefone ficam de fora de propósito. */
function resumir(d: RespostaBrasilApi): EmpresaReceita {
  const porte = String(d.porte ?? "").toUpperCase();
  const fantasia = d.nome_fantasia?.trim() || null;
  return {
    cnpj: d.cnpj,
    nome: (fantasia ?? d.razao_social).slice(0, 60),
    razaoSocial: d.razao_social,
    nomeFantasia: fantasia,
    porte,
    porteTexto: PORTE_TEXTO[porte] ?? porte,
    cnae: d.cnae_fiscal ? { codigo: d.cnae_fiscal, descricao: d.cnae_fiscal_descricao ?? "" } : null,
    atividadeSugerida: atividadePorCnae(d.cnae_fiscal),
    regime: regimeDe(d),
    municipio: d.municipio ?? null,
    uf: d.uf ?? null,
    abertura: d.data_inicio_atividade ?? null,
    situacao: d.descricao_situacao_cadastral ?? null,
  };
}

// Cache da instância. Some a cada deploy — suficiente para o beta.
const cache = new Map<string, { empresa: EmpresaReceita; expira: number }>();

export async function consultarCnpj(entrada: string): Promise<ResultadoConsulta> {
  const cnpj = soDigitos(entrada);
  if (!cnpjValido(cnpj)) return { ok: false, motivo: "invalido" };

  const guardado = cache.get(cnpj);
  if (guardado && guardado.expira > Date.now()) return { ok: true, empresa: guardado.empresa };

  try {
    const resposta = await fetch(ORIGEM + cnpj, {
      headers: { Accept: "application/json", "User-Agent": "lesstax-app" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (resposta.status === 404) return { ok: false, motivo: "nao_encontrado" };
    if (!resposta.ok) throw new Error(`brasilapi ${resposta.status}`);

    const empresa = resumir((await resposta.json()) as RespostaBrasilApi);
    cache.set(cnpj, { empresa, expira: Date.now() + CACHE_MS });
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    return { ok: true, empresa };
  } catch (erro) {
    console.error("[brasilapi]", erro instanceof Error ? erro.message : erro);
    return { ok: false, motivo: "indisponivel" };
  }
}
