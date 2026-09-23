/**
 * Situação da empresa no ano: sublimite, teto e permanência no Simples.
 * Tudo medido pela receita do ANO-CALENDÁRIO (RBA), nunca pela RBT12.
 *
 * Os quatro marcos (LC 123, art. 3º, §§ 9º e 9º-A; arts. 13-A e 20):
 * - até R$ 3,6 mi: tudo no DAS;
 * - acima de 3,6 mi até 4,32 mi: ICMS/ISS seguem no DAS até dezembro, saem em janeiro;
 * - acima de 4,32 mi: ICMS/ISS saem do DAS no mês seguinte ao excesso;
 * - acima de 4,8 mi até 5,76 mi: federais seguem no DAS até dezembro; sai do Simples em janeiro;
 * - acima de 5,76 mi: sai do Simples no mês seguinte ao excesso.
 *
 * Fora desta versão: início de atividade (limites proporcionais e efeito
 * retroativo) e a alíquota própria da parcela que excede (Res. CGSN 140, art. 24).
 */
import { ALERTA_PATAMAR, PATAMARES } from "./tabelas";
import type { Aviso, Patamar, ReceitaAno, Situacao } from "./tipos";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const milhoes = (v: number) => `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} milhões`;

/** "outubro de 2026" — o mês seguinte a `mes`/`ano`. */
function mesSeguinte(ano: number, mes: number) {
  return mes === 12 ? `janeiro de ${ano + 1}` : `${MESES[mes]} de ${ano}`;
}

const MULTA =
  "Se a comunicação atrasar, a multa é de 10% dos tributos do Simples do mês anterior ao início dos efeitos, no mínimo R$ 200 (LC 123, art. 36).";

const comunicar = (quando: string) =>
  `É preciso comunicar no Portal do Simples Nacional até o último dia útil de ${quando} (LC 123, art. 30). ${MULTA}`;

/** O que acontece ao passar de cada marco — texto curto para o alerta de 80%. */
const CONSEQUENCIA: Record<Patamar, string> = {
  sublimite: "o ICMS/ISS sai do DAS em janeiro do ano seguinte",
  sublimiteMais20: "o ICMS/ISS sai do DAS já no mês seguinte",
  teto: "a empresa sai do Simples em janeiro do ano seguinte",
  tetoMais20: "a empresa sai do Simples já no mês seguinte",
};

const ORDEM: Patamar[] = ["sublimite", "sublimiteMais20", "teto", "tetoMais20"];

export function situacaoNoAno(r: ReceitaAno): Situacao {
  const anterior = r.rbaAnoAnterior ?? 0;
  const avisos: Aviso[] = [];

  // --- Efeitos que já valem neste mês.
  const saiuPeloAnoAnterior = anterior > PATAMARES.teto;
  const saiuNesteAno = r.rbaAteMesAnterior > PATAMARES.tetoMais20;
  const noSimples = !saiuPeloAnoAnterior && !saiuNesteAno;
  const icmsIssNoDas = anterior <= PATAMARES.sublimite && r.rbaAteMesAnterior <= PATAMARES.sublimiteMais20;

  // --- O ano anterior já decidiu algo para este ano.
  if (anterior > PATAMARES.tetoMais20) {
    avisos.push({
      id: "fora-ano-anterior",
      nivel: "alerta",
      titulo: "A empresa não está mais no Simples",
      texto: `Em ${r.ano - 1} a receita foi de ${milhoes(anterior)}, mais de 20% acima do teto de R$ 4,8 milhões. A exclusão valeu a partir do mês seguinte ao excesso. Os números abaixo são uma referência do Simples, não o que a empresa paga.`,
    });
  } else if (saiuPeloAnoAnterior) {
    avisos.push({
      id: "fora-ano-anterior",
      nivel: "alerta",
      titulo: `Fora do Simples desde janeiro de ${r.ano}`,
      texto: `Em ${r.ano - 1} a receita foi de ${milhoes(anterior)}, acima do teto de R$ 4,8 milhões. Com excesso de até 20%, a empresa ficou no Simples até dezembro e saiu em janeiro. Os números abaixo são uma referência do Simples, não o que a empresa paga.`,
    });
  } else if (anterior > PATAMARES.sublimite) {
    avisos.push({
      id: "icms-iss-ano-anterior",
      nivel: "alerta",
      titulo: `ICMS/ISS fora do DAS desde janeiro de ${r.ano}`,
      texto: `Em ${r.ano - 1} a receita foi de ${milhoes(anterior)}, acima do sublimite de R$ 3,6 milhões. O ICMS/ISS é pago à parte, pelas regras normais do estado ou do município, e não está somado no imposto abaixo.`,
    });
  }

  // --- Marcos ultrapassados neste ano (o mais grave de cada par).
  const e = r.excessos;
  if (e.tetoMais20) {
    avisos.push({
      id: "teto-20",
      nivel: "alerta",
      titulo: `Receita do ano passou de R$ 5,76 milhões em ${MESES[e.tetoMais20 - 1]}`,
      texto: `O excesso passou de 20% do teto: a empresa sai do Simples a partir de ${mesSeguinte(r.ano, e.tetoMais20)}. ${comunicar(mesSeguinte(r.ano, e.tetoMais20))}`,
    });
  } else if (e.teto) {
    avisos.push({
      id: "teto",
      nivel: "alerta",
      titulo: `Receita do ano passou de R$ 4,8 milhões em ${MESES[e.teto - 1]}`,
      texto: `Como o excesso é de até 20%, os impostos federais continuam no DAS até dezembro, e a empresa sai do Simples em janeiro de ${r.ano + 1}. ${comunicar(`janeiro de ${r.ano + 1}`)}`,
    });
  }
  if (!e.tetoMais20) {
    if (e.sublimiteMais20) {
      avisos.push({
        id: "sublimite-20",
        nivel: "alerta",
        titulo: `Receita do ano passou de R$ 4,32 milhões em ${MESES[e.sublimiteMais20 - 1]}`,
        texto: `O ICMS/ISS sai do DAS a partir de ${mesSeguinte(r.ano, e.sublimiteMais20)} e passa a ser pago à parte — o app ainda não estima esse valor. Os impostos federais continuam no DAS. ${comunicar(mesSeguinte(r.ano, e.sublimiteMais20))}`,
      });
    } else if (e.sublimite) {
      avisos.push({
        id: "sublimite",
        nivel: "alerta",
        titulo: `Receita do ano passou de R$ 3,6 milhões em ${MESES[e.sublimite - 1]}`,
        texto: `O ICMS/ISS continua no DAS até dezembro e sai em janeiro de ${r.ano + 1}, quando passa a ser pago à parte. ${comunicar(`janeiro de ${r.ano + 1}`)}`,
      });
    }
  }

  // --- Chegando perto: 80% de cada marco ainda não ultrapassado.
  for (const p of ORDEM) {
    const valor = PATAMARES[p];
    if (e[p] || r.rba < valor * ALERTA_PATAMAR) continue;
    avisos.push({
      id: `perto-${p}`,
      nivel: "atencao",
      titulo: `Receita do ano em ${Math.floor((r.rba / valor) * 100)}% de ${milhoes(valor)}`,
      texto: `De janeiro até ${MESES[r.mes - 1]}, a empresa faturou ${reais(r.rba)}. Se passar de ${milhoes(valor)} no ano, ${CONSEQUENCIA[p]}.`,
    });
  }

  if (avisos.length > 0 && r.mesesSemLancamento > 0) {
    avisos.push({
      id: "meses-faltando",
      nivel: "atencao",
      titulo: "A receita do ano pode estar incompleta",
      texto: `${r.mesesSemLancamento} ${r.mesesSemLancamento === 1 ? "mês" : "meses"} de ${r.ano} ainda não ${r.mesesSemLancamento === 1 ? "foi lançado" : "foram lançados"}. Os marcos acima usam só o que está lançado.`,
    });
  }

  return { noSimples, icmsIssNoDas, receitaAno: r, avisos };
}
