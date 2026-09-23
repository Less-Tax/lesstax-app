"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { Entrada, Resultado } from "@/lib/tributario";

type Fatia = { chave: string; rotulo: string; valor: number; cor: string };

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const porcento = (v: number) => (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";

/**
 * Para onde vai o dinheiro do mês, em rosca, sempre em reais.
 * Passar o mouse (ou o foco) numa fatia ou na legenda troca o número do meio —
 * em vez de uma caixinha flutuante que taparia o centro.
 * Com prejuízo, as partes passam do que entrou: a rosca mostra as saídas.
 */
export function RoscaRaioX({
  entrada,
  resultado,
  nomeMes,
}: {
  entrada: Entrada;
  resultado: Resultado;
  nomeMes: string;
}) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const prejuizo = resultado.lucro < 0;

  const fatias: Fatia[] = [
    { chave: "imposto", rotulo: "Impostos", valor: resultado.imposto, cor: "var(--grafico-imposto)" },
    { chave: "folha", rotulo: "Salários e pró-labore", valor: entrada.folha, cor: "var(--grafico-folha)" },
    { chave: "custo", rotulo: "Custo total", valor: entrada.custos, cor: "var(--grafico-custo)" },
    {
      chave: "lucro",
      rotulo: "Lucro",
      valor: resultado.lucro,
      cor: "var(--grafico-lucro)",
    },
  ].filter((f) => !(prejuizo && f.chave === "lucro"));

  const total = prejuizo ? fatias.reduce((s, f) => s + f.valor, 0) : entrada.faturamento;
  const visiveis = fatias.filter((f) => f.valor > 0);
  const escolhida = fatias.find((f) => f.chave === ativa) ?? null;

  // O meio: a fatia apontada; sem nada apontado, o número principal.
  const centro = escolhida
    ? { valor: escolhida.valor, rotulo: escolhida.rotulo, parte: porcento(escolhida.valor / total) }
    : prejuizo
        ? { valor: -resultado.lucro, rotulo: "de prejuízo", parte: null }
        : { valor: resultado.imposto, rotulo: "de imposto", parte: porcento(resultado.imposto / total) };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold">
        {prejuizo ? "Para onde foi o dinheiro" : `Dos ${reais(entrada.faturamento)} de ${nomeMes}`}
      </h2>

      <div className="relative mx-auto aspect-square w-full max-w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visiveis}
              dataKey="valor"
              nameKey="rotulo"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
              onMouseEnter={(_, i) => setAtiva(visiveis[i]?.chave ?? null)}
              onMouseLeave={() => setAtiva(null)}
            >
              {visiveis.map((f) => (
                <Cell
                  key={f.chave}
                  fill={f.cor}
                  opacity={ativa && ativa !== f.chave ? 0.35 : 1}
                  className="cursor-pointer outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
        >
          <p className="font-display text-2xl font-bold tabular-nums">{reais(centro.valor)}</p>
          <p className="text-xs leading-tight text-muted-foreground">{centro.rotulo}</p>
          {centro.parte ? <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{centro.parte}</p> : null}
        </div>
      </div>

      <ul className="flex flex-col">
        {fatias.map((f) => (
          <li
            key={f.chave}
            tabIndex={0}
            onMouseEnter={() => setAtiva(f.chave)}
            onMouseLeave={() => setAtiva(null)}
            onFocus={() => setAtiva(f.chave)}
            onBlur={() => setAtiva(null)}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
              ativa === f.chave ? "bg-card-muted" : ""
            }`}
          >
            <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: f.cor }} />
            <span className="flex-1">{f.rotulo}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{porcento(f.valor / total)}</span>
            <b className="w-24 text-right tabular-nums">{reais(f.valor)}</b>
          </li>
        ))}
      </ul>

      {prejuizo ? (
        <p className="rounded-xl bg-card-muted p-3 text-sm">
          As saídas passaram o que entrou em <b>{reais(-resultado.lucro)}</b>. A rosca mostra para onde foi o
          dinheiro que saiu.
        </p>
      ) : null}
    </div>
  );
}
