/**
 * Missões: pequenas tarefas que deixam a empresa "no controle".
 * Puro — recebe o que já se sabe da empresa e devolve a lista.
 */
import { chave, somar, ultimoMesFechado, type Competencia } from "@/lib/competencia";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Janela da escolha DAS × Simples híbrido para o 1º semestre de 2027. */
export const JANELA_REFORMA = { fim: new Date("2026-09-30T23:59:59-03:00"), referencia: "2027-1" };

/** Missões que a própria pessoa marca como feitas (o resto é calculado). */
export const MISSOES_MARCAVEIS = ["fator_r", "monofasico", "anexo", "reforma"] as const;
export type MissaoMarcavel = (typeof MISSOES_MARCAVEIS)[number];

export type Acao =
  | { tipo: "link"; href: string; rotulo: string }
  | { tipo: "marcar"; missao: MissaoMarcavel; referencia: string; rotulo: string; saibaMais?: { href: string; rotulo: string } }
  | { tipo: "especialista" };

export type Missao = { id: string; titulo: string; descricao: string; feita: boolean; acao: Acao | null };

export type ContextoMissoes = {
  atividade: string;
  /** Meses lançados. */
  lancados: readonly Competencia[];
  /** "missao:referencia" já marcadas. */
  marcadas: ReadonlySet<string>;
  perguntouAoLessy: boolean;
  pediuEspecialista: boolean;
  agora: Date;
};

const perguntaLessy = (texto: string) => `/lessy?nova=1&pergunta=${encodeURIComponent(texto)}`;

export function missoes(ctx: ContextoMissoes): Missao[] {
  const fechado = ultimoMesFechado(ctx.agora);
  const lancou = new Set(ctx.lancados.map(chave));
  const marcada = (m: string, ref = "sempre") => ctx.marcadas.has(`${m}:${ref}`);
  const lista: Missao[] = [];

  // 1. O mês que acabou de fechar — volta todo mês.
  const nomeFechado = MESES[fechado.mes - 1];
  lista.push({
    id: "mes",
    titulo: `Lançar ${nomeFechado}`,
    descricao: "Quem acompanha todo mês percebe os problemas antes.",
    feita: lancou.has(chave(fechado)),
    acao: { tipo: "link", href: `/meses?mes=${chave(fechado)}`, rotulo: `Lançar ${nomeFechado}` },
  });

  // 2. Os 12 meses antes dele: é com eles que a Receita calcula a faixa.
  const faltam: Competencia[] = [];
  for (let i = 1; i <= 12; i++) {
    const m = somar(fechado, -i);
    if (!lancou.has(chave(m))) faltam.push(m);
  }
  const proximo = faltam[0];
  lista.push({
    id: "historico",
    titulo: "Completar os últimos 12 meses",
    descricao:
      faltam.length === 0
        ? "Sua receita de 12 meses é exata, igual à conta da Receita."
        : `Faltam ${faltam.length} ${faltam.length === 1 ? "mês" : "meses"}. Com os 12, a faixa do imposto fica exata.`,
    feita: faltam.length === 0,
    acao: proximo
      ? { tipo: "link", href: `/meses?mes=${chave(proximo)}`, rotulo: `Lançar ${MESES[proximo.mes - 1]} de ${proximo.ano}` }
      : null,
  });

  // 3. Uma missão da atividade.
  if (ctx.atividade === "profissionais") {
    lista.push({
      id: "fator_r",
      titulo: "Entender seu Fator R",
      descricao: "Ele decide se você paga o Anexo V, mais caro, ou o III.",
      feita: marcada("fator_r"),
      acao: {
        tipo: "marcar",
        missao: "fator_r",
        referencia: "sempre",
        rotulo: "Entendi",
        saibaMais: { href: perguntaLessy("Como funciona o meu Fator R?"), rotulo: "Perguntar ao Lessy" },
      },
    });
  } else if (ctx.atividade === "comercio") {
    lista.push({
      id: "monofasico",
      titulo: "Conferir produtos com imposto já pago",
      descricao: "Bebidas, cosméticos, remédios e autopeças podem estar pagando PIS e Cofins em dobro.",
      feita: marcada("monofasico"),
      acao: {
        tipo: "marcar",
        missao: "monofasico",
        referencia: "sempre",
        rotulo: "Conferi com meu contador",
        saibaMais: { href: perguntaLessy("O que são produtos monofásicos?"), rotulo: "Perguntar ao Lessy" },
      },
    });
  } else {
    lista.push({
      id: "anexo",
      titulo: "Conferir se o anexo está certo",
      descricao: "Um anexo errado muda o imposto de todo mês.",
      feita: marcada("anexo"),
      acao: {
        tipo: "marcar",
        missao: "anexo",
        referencia: "sempre",
        rotulo: "Conferi",
        saibaMais: { href: "/raio-x", rotulo: "Ver no Raio-X" },
      },
    });
  }

  // 4. Reforma: só enquanto a janela está aberta (ou se já foi marcada).
  const refReforma = JANELA_REFORMA.referencia;
  if (ctx.agora <= JANELA_REFORMA.fim || marcada("reforma", refReforma)) {
    lista.push({
      id: "reforma",
      titulo: "Decidir: DAS ou Simples híbrido",
      descricao: "Escolha feita até 30 de setembro, que muda seus impostos no 1º semestre de 2027.",
      feita: marcada("reforma", refReforma),
      acao: {
        tipo: "marcar",
        missao: "reforma",
        referencia: refReforma,
        rotulo: "Já decidi",
        saibaMais: { href: perguntaLessy("Devo escolher o Simples híbrido?"), rotulo: "Perguntar ao Lessy" },
      },
    });
  }

  // 5. Uma pergunta ao Lessy.
  lista.push({
    id: "lessy",
    titulo: "Tirar uma dúvida com o Lessy",
    descricao: "Ele já conhece seus números e explica em linguagem simples.",
    feita: ctx.perguntouAoLessy,
    acao: { tipo: "link", href: "/lessy", rotulo: "Abrir o Lessy" },
  });

  // 6. Especialista.
  lista.push({
    id: "especialista",
    titulo: "Revisar o regime com um especialista",
    descricao: "Uma conversa com a Less Tax para ver se existe um caminho mais barato.",
    feita: ctx.pediuEspecialista,
    acao: { tipo: "especialista" },
  });

  return lista;
}

/** Saúde tributária: 0 a 100, pela fração de missões feitas. */
export function saude(lista: readonly Missao[]) {
  if (lista.length === 0) return 0;
  return Math.round((lista.filter((m) => m.feita).length / lista.length) * 100);
}

export function nivel(pontos: number) {
  return pontos >= 80 ? "No controle" : pontos >= 40 ? "Atento" : "Começando";
}

// Escala do vermelho ao verde, sem degrau (a mesma do MVP).
const ESCALA = [
  { p: 0, h: 0, s: 85, l: 46 },
  { p: 18, h: 4, s: 80, l: 50 },
  { p: 34, h: 13, s: 73, l: 55 },
  { p: 44, h: 30, s: 86, l: 52 },
  { p: 52, h: 45, s: 96, l: 50 },
  { p: 68, h: 49, s: 93, l: 54 },
  { p: 78, h: 72, s: 62, l: 46 },
  { p: 86, h: 120, s: 48, l: 44 },
  { p: 100, h: 163, s: 74, l: 33 },
];

export function corDaSaude(pontos: number) {
  const v = Math.max(0, Math.min(100, pontos));
  let i = 0;
  while (i < ESCALA.length - 2 && v > ESCALA[i + 1].p) i++;
  const a = ESCALA[i];
  const b = ESCALA[i + 1];
  const t = (v - a.p) / (b.p - a.p);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `hsl(${mix(a.h, b.h)} ${mix(a.s, b.s)}% ${mix(a.l, b.l)}%)`;
}

/** Para ordenar a lista: pendentes primeiro, na ordem de importância. */
export const pendentesPrimeiro = (lista: readonly Missao[]) => [...lista].sort((a, b) => Number(a.feita) - Number(b.feita));

