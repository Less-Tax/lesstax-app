import { porcento, reais } from "./formato";
import { aliquotaEfetiva } from "./calcular";
import { FATOR_R_MINIMO, TABELAS, TETO_SIMPLES } from "./tabelas";
import type { Entrada, Resultado } from "./tipos";

/**
 * O que o Raio-X mostra além dos números: oportunidades e alertas.
 * Pura: recebe o cálculo e devolve textos. A tela só desenha.
 */

export type Tom = "oportunidade" | "positivo" | "neutro" | "alerta";

export type Cartao = {
  id: string;
  tom: Tom;
  etiqueta?: string;
  titulo: string;
  paragrafos: string[];
  destaque?: { rotulo: string; valor: string };
  nota?: string;
};

export type Contexto = {
  entrada: Entrada;
  resultado: Resultado;
  clientes: "pf" | "pj" | "ambos" | null;
  /** Regime que a Receita informa, quando a empresa tem CNPJ. */
  regime: string | null;
  hoje: Date;
};

/** Prazo da escolha entre DAS e Simples híbrido para 2027 (reforma tributária). */
export const PRAZO_REFORMA = new Date("2026-09-30T23:59:59-03:00");
const INSS_SOBRE_PRO_LABORE = 0.11;

/** A frase grande do topo do Raio-X. */
export function manchete({ entrada, resultado }: Pick<Contexto, "entrada" | "resultado">) {
  if (resultado.acimaDoTeto) {
    return "Sua empresa fatura mais do que o limite do Simples Nacional. Aqui a conta depende de Lucro Presumido ou Real, e vale a análise de um especialista.";
  }
  const parte = porcento(resultado.imposto / entrada.faturamento);
  if (resultado.lucro >= 0) {
    return `Por mês, cerca de ${reais(resultado.imposto)} vão para impostos (${parte} do que entra). Sobram ${reais(resultado.lucro)} de lucro.`;
  }
  return `Por mês, cerca de ${reais(resultado.imposto)} vão para impostos, e as saídas passam o faturamento em ${reais(-resultado.lucro)}.`;
}

export function oportunidades(ctx: Contexto): Cartao[] {
  const { entrada, resultado: r, clientes, regime, hoje } = ctx;
  const cartoes: Cartao[] = [];

  // --- A Receita diz que a empresa não está no Simples: o resto é referência.
  if (regime === "lucro_real" || regime === "lucro_presumido" || regime === "fora") {
    cartoes.push({
      id: "regime",
      tom: "alerta",
      titulo: "Pela Receita, a empresa não está no Simples",
      paragrafos: [
        "O Raio-X calcula o Simples Nacional. Para a sua empresa, os números abaixo servem de comparação — não mostram o que você paga hoje.",
      ],
    });
  }
  if (regime === "mei") {
    cartoes.push({
      id: "mei",
      tom: "neutro",
      titulo: "MEI paga um valor fixo por mês",
      paragrafos: [
        "Os números abaixo mostram quanto a empresa pagaria no Simples Nacional. Servem para saber a hora de deixar de ser MEI.",
      ],
    });
  }

  // --- Acima do teto: o Simples não se aplica.
  if (r.acimaDoTeto) {
    cartoes.push({
      id: "fora-do-simples",
      tom: "alerta",
      etiqueta: "Fora do Simples",
      titulo: "Aqui a conta é outra",
      paragrafos: [
        `Seu faturamento anual estimado é de ${reais(r.rbt12)}, acima do teto de ${reais(TETO_SIMPLES)} do Simples Nacional. Empresas nessa faixa pagam por Lucro Presumido ou Lucro Real, e a diferença entre os dois costuma ser grande.`,
      ],
      destaque: { rotulo: "Sem os impostos, sobram por mês", valor: reais(r.lucro) },
      nota: "Este número ainda não desconta impostos: no Presumido ou no Real eles dependem da atividade, dos créditos e da folha. Um especialista faz essa conta com os seus números.",
    });
    return cartoes;
  }

  // --- Fator R: serviços técnicos entre o Anexo III e o V.
  if (entrada.atividade === "profissionais") {
    if (r.anexo === "V") {
      // O Fator R é apurado em 12 meses: o aumento é o que falta na folha de
      // 12 meses para chegar a 28%, espalhado por mês. Simulações antigas não
      // têm folha12; nelas a estimativa era a folha do mês × 12.
      const folha12 = r.folha12 ?? entrada.folha * 12;
      const aumento = (FATOR_R_MINIMO * r.rbt12 - folha12) / 12;
      const impostoNoIII = entrada.faturamento * aliquotaEfetiva(r.rbt12, TABELAS[r.regrasVersao].III);
      const economia = r.imposto - impostoNoIII - aumento * INSS_SOBRE_PRO_LABORE;
      if (economia > 0) {
        cartoes.push({
          id: "fator-r",
          tom: "oportunidade",
          etiqueta: "Oportunidade",
          titulo: "Você pode estar no anexo mais caro",
          paragrafos: [
            `Hoje seus salários e pró-labore são ${porcento(r.fatorR)} do faturamento. Chegando a 28% (o chamado Fator R), a empresa passa do Anexo V para o Anexo III.`,
          ],
          destaque: {
            rotulo: `Aumentando o pró-labore em ${reais(aumento)}, a economia estimada é de`,
            valor: `${reais(economia)} por mês`,
          },
          nota: "Já descontamos 11% de INSS sobre o aumento. Pode haver Imposto de Renda sobre o pró-labore: confirme com o contador.",
        });
      }
    } else {
      cartoes.push({
        id: "fator-r",
        tom: "positivo",
        titulo: "O Fator R está a seu favor",
        paragrafos: [
          `Seus salários e pró-labore são ${porcento(r.fatorR)} do faturamento, acima dos 28%. Por isso a empresa fica no Anexo III, que é mais barato. Se a folha cair abaixo disso, o imposto sobe.`,
        ],
      });
    }
  }

  // --- Reforma tributária: DAS ou Simples híbrido (o MEI fica de fora).
  if (regime !== "mei") {
    const dias = Math.ceil((PRAZO_REFORMA.getTime() - hoje.getTime()) / 86_400_000);
    const aberto = dias > 0;
    const recomendacao =
      clientes === "pj"
        ? "Como você vende principalmente para empresas, o Simples híbrido pode deixar seu preço mais competitivo, porque seus clientes aproveitam mais crédito de imposto."
        : clientes === "pf"
          ? "Como você vende principalmente para pessoas, manter tudo dentro do DAS costuma ser o caminho mais simples."
          : "Como você vende para pessoas e empresas, a resposta depende de quanto cada um pesa no seu faturamento.";
    cartoes.push({
      id: "reforma",
      tom: "oportunidade",
      etiqueta: aberto ? (dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`) : "Próxima janela: março de 2027",
      titulo: "Reforma tributária: DAS ou Simples híbrido?",
      paragrafos: [
        `${aberto ? "Até 30 de setembro de 2026" : "Na próxima janela"}, cada empresa do Simples escolhe como vai pagar os novos impostos (IBS e CBS) em 2027. Quem não escolher continua pagando tudo no DAS.`,
        recomendacao,
      ],
    });
  }

  // --- Monofásicos: imposto que talvez esteja sendo pago duas vezes.
  if (r.monofasicoEmDobro > 0) {
    cartoes.push({
      id: "monofasico",
      tom: "oportunidade",
      etiqueta: "Oportunidade",
      titulo: "Imposto que talvez você pague duas vezes",
      paragrafos: [
        "Em bebidas, cosméticos, remédios, autopeças e pneus, parte do imposto (PIS e Cofins) já foi paga pela fábrica. Se essas vendas não são separadas na hora de calcular o DAS, a loja paga de novo.",
        `Se a separação nunca foi feita, os últimos 5 anos podem somar até ${reais(r.monofasicoEmDobro * 60)} para recuperar.`,
      ],
      destaque: { rotulo: "Pelo que você informou, isso pode chegar a", valor: `${reais(r.monofasicoEmDobro)} por mês` },
      nota: "Estimativa. Se o seu contador já separa essas vendas, esse valor não existe. Só uma revisão das notas confirma.",
    });
  }

  // --- Anexo IV: INSS da empresa fora da guia.
  if (r.inssFora > 0) {
    cartoes.push({
      id: "inss-fora",
      tom: "neutro",
      titulo: "Um imposto fora da guia",
      paragrafos: [
        `Em obras, limpeza e vigilância, o INSS da empresa (cerca de 20% sobre salários e pró-labore) não vem no DAS: é pago à parte. Já incluímos na conta: ${reais(r.inssFora)} por mês, além de ${reais(r.das)} do DAS.`,
      ],
    });
  }

  // --- Entre R$ 3,6 e 4,8 milhões: ICMS/ISS saem do DAS e não entram na conta.
  if (r.acimaDoSublimite) {
    cartoes.push({
      id: "sublimite",
      tom: "alerta",
      titulo: "Perto do limite",
      paragrafos: [
        `Seu faturamento anual estimado é de ${reais(r.rbt12)}. Acima de R$ 3,6 milhões, o ICMS e o ISS saem do DAS e passam a ser pagos à parte — e não estão incluídos nos números acima. Acima de R$ 4,8 milhões, a empresa sai do Simples.`,
      ],
    });
  }

  return cartoes;
}

const ANEXO_TEXTO = {
  I: "Anexo I, comércio",
  II: "Anexo II, indústria",
  III: "Anexo III, serviços",
  IV: "Anexo IV, obras e serviços",
  V: "Anexo V, serviços",
} as const;

/** "Simples Nacional, Anexo V, serviços" — a linha pequena acima do nome. */
export function rotuloRegime(r: Resultado) {
  return r.acimaDoTeto ? "Faturamento acima do limite do Simples" : `Simples Nacional, ${ANEXO_TEXTO[r.anexo]}`;
}

