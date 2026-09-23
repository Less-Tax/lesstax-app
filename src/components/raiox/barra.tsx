import { reais } from "@/lib/formato";
import type { Entrada, Resultado } from "@/lib/tributario";

type Parte = { chave: string; rotulo: string; valor: number; cor: string };

/**
 * "De cada R$ 100 que entram": a barra do Raio-X e a legenda.
 * Acima do teto do Simples o imposto não é conhecido, então some da barra —
 * mostrar "R$ 0" de imposto seria mentira.
 */
export function BarraRaioX({ entrada, resultado }: { entrada: Entrada; resultado: Resultado }) {
  const partes: Parte[] = [
    { chave: "imposto", rotulo: "Impostos", valor: resultado.imposto, cor: "bg-imposto" },
    { chave: "folha", rotulo: "Salários e pró-labore", valor: entrada.folha, cor: "bg-folha" },
    { chave: "custo", rotulo: "Custo total", valor: entrada.custos, cor: "bg-custo" },
    {
      chave: "lucro",
      rotulo: resultado.acimaDoTeto ? "Sobra antes dos impostos" : resultado.lucro >= 0 ? "Lucro" : "Prejuízo",
      valor: resultado.lucro,
      cor: resultado.lucro >= 0 ? "bg-lucro" : "bg-destructive",
    },
  ].filter((p) => !(resultado.acimaDoTeto && p.chave === "imposto"));

  // Com prejuízo, a barra representa tudo o que saiu, não o que entrou.
  const base = resultado.lucro >= 0 ? entrada.faturamento : entrada.faturamento - resultado.lucro;
  const visiveis = partes.filter((p) => p.valor > 0);
  const porCem = (v: number) => Math.round((v / entrada.faturamento) * 100);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={partes.map((p) => `${p.rotulo}: ${porCem(p.valor)} reais`).join(", ")}
        className="flex h-16 overflow-hidden rounded-xl border-2 border-foreground"
      >
        {visiveis.map((p) => {
          const fatia = p.valor / base;
          return (
            <div
              key={p.chave}
              className={`${p.cor} flex items-end justify-start px-1.5 pb-1 text-sm font-bold text-white dark:text-background`}
              style={{ flexGrow: fatia, flexBasis: 0 }}
            >
              {fatia >= 0.06 ? porCem(p.valor) : ""}
            </div>
          );
        })}
      </div>

      <ul className="flex flex-col gap-1.5">
        {partes.map((p) => (
          <li key={p.chave} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden="true" className={`${p.cor} size-3 shrink-0 rounded-full`} />
            <span className="flex-1">{p.rotulo}</span>
            <b className="tabular-nums">{reais(porCem(p.valor))}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
