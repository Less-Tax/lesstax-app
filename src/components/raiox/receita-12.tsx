import Link from "next/link";
import { Info } from "lucide-react";
import { competencia, nomeDoMes, reais } from "@/lib/formato";
import type { OrigemRbt12 } from "@/lib/tributario";

/**
 * Explica de onde saiu a receita de 12 meses que define a faixa do imposto.
 * Quando é estimativa, diz qual mês lançar para chegar no cálculo exato.
 */
export function Receita12({
  rbt12,
  origem,
  mes,
  proximoParaLancar,
}: {
  rbt12: number;
  origem: OrigemRbt12 | undefined;
  mes: number;
  proximoParaLancar: { ano: number; mes: number } | null;
}) {
  // Simulações antigas não guardavam a origem: eram o próprio mês × 12.
  const o = origem ?? { tipo: "mes" as const, meses: 0 };
  const nome = nomeDoMes(mes);

  if (o.tipo === "historico") {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-card-muted p-3.5 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Faixa do Simples calculada com <b className="text-foreground">{reais(rbt12)}</b> de receita nos 12 meses
          antes de {nome}, como faz a Receita.
        </span>
      </p>
    );
  }

  const como =
    o.tipo === "media"
      ? `pela média dos ${o.meses === 1 ? "único mês lançado" : `${o.meses} meses lançados`} antes de ${nome}`
      : `repetindo ${nome} por 12 meses, porque não há meses lançados antes dele`;

  return (
    <div className="flex items-start gap-2 rounded-2xl border border-dashed border-border p-3.5 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <p>
          A faixa do imposto usa a receita dos 12 meses anteriores. Aqui ela foi <b>estimada</b> em{" "}
          <b>{reais(rbt12)}</b>, {como}.
        </p>
        {proximoParaLancar ? (
          <Link
            href={`/meses?mes=${proximoParaLancar.ano}-${String(proximoParaLancar.mes).padStart(2, "0")}`}
            className="w-fit font-semibold text-primary underline-offset-4 hover:underline"
          >
            Lançar {competencia(proximoParaLancar.ano, proximoParaLancar.mes).toLowerCase()} para chegar no valor exato
          </Link>
        ) : null}
      </div>
    </div>
  );
}
