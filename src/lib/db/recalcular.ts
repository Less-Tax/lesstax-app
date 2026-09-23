import "server-only";
import type { Competencia } from "@/lib/competencia";
import { mesesDaEmpresa, type Mes } from "@/lib/db/meses";
import { registrarSimulacoes } from "@/lib/db/simulacoes";
import { calcular, historico12, type Atividade } from "@/lib/tributario";

/**
 * Gera uma simulação nova para os meses lançados. As antigas ficam como
 * foram mostradas; a tela usa sempre a mais recente de cada mês.
 *
 * `aPartirDe`: recalcula esse mês e os 12 seguintes — que é o que muda quando
 * um mês é lançado, porque a faixa de cada mês depende dos 12 anteriores.
 * Sem ele, recalcula todos (quando muda a atividade da empresa, por exemplo).
 */
export async function recalcularMeses(empresaId: string, atividade: Atividade, aPartirDe?: Competencia) {
  const meses = await mesesDaEmpresa(empresaId);
  const indice = (m: Competencia) => m.ano * 12 + m.mes;

  const afetados = aPartirDe
    ? meses.filter((m) => {
        const distancia = indice(m) - indice(aPartirDe);
        return distancia >= 0 && distancia <= 12;
      })
    : meses;

  await registrarSimulacoes(
    empresaId,
    afetados.map((m: Mes) => {
      // Monofásico só existe no comércio.
      const monofasico = atividade === "comercio" ? m.monofasico : 0;
      const entrada = { atividade, faturamento: m.faturamento, folha: m.folha, custos: m.custos, monofasico };
      return {
        entrada: { ...entrada, ano: m.ano, mes: m.mes },
        resultado: calcular(entrada, undefined, historico12(meses, m)),
      };
    }),
  );
  return afetados.length;
}
