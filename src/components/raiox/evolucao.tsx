"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PontoEvolucao = {
  chave: string; // "2026-08"
  rotulo: string; // "ago/26"
  nomeCompleto: string; // "Agosto de 2026"
  imposto: number;
  lucro: number;
  escolhido: boolean;
};

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const compacto = (v: number) => v.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

const SERIES = [
  { chave: "imposto", rotulo: "Imposto", cor: "var(--grafico-imposto)" },
  { chave: "lucro", rotulo: "Lucro", cor: "var(--grafico-lucro)" },
] as const;

function Dica({ active, payload }: { active?: boolean; payload?: { payload: PontoEvolucao }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">{p.nomeCompleto}</p>
      {SERIES.map((s) => (
        <p key={s.chave} className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: s.cor }} aria-hidden="true" />
          <span className="text-muted-foreground">{s.chave === "lucro" && p.lucro < 0 ? "Prejuízo" : s.rotulo}</span>
          <b className="ml-auto pl-3 tabular-nums">{reais(Math.abs(p[s.chave]))}</b>
        </p>
      ))}
    </div>
  );
}

/**
 * Imposto e lucro, mês a mês. Uma escala só (os dois em reais).
 * Clicar numa coluna abre o Raio-X daquele mês.
 */
export function Evolucao({ pontos }: { pontos: PontoEvolucao[] }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legenda">
        {SERIES.map((s) => (
          <li key={s.chave} className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: s.cor }} aria-hidden="true" />
            {s.rotulo}
          </li>
        ))}
        <li className="text-muted-foreground">em reais</li>
      </ul>

      <div className="h-56 w-full" role="img" aria-label="Gráfico de imposto e lucro por mês. A tabela abaixo tem os mesmos números.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={pontos}
            margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
            barGap={2}
            barCategoryGap="28%"
            onClick={(e) => {
              const alvo = pontos[Number(e?.activeTooltipIndex)];
              if (alvo) router.push(`/raio-x?mes=${alvo.chave}`, { scroll: false });
            }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tickFormatter={compacto}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip content={<Dica />} cursor={{ fill: "var(--card-muted)" }} />
            {SERIES.map((s) => (
              <Bar
                key={s.chave}
                dataKey={s.chave}
                name={s.rotulo}
                fill={s.cor}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                className="cursor-pointer"
                // o mês aberto fica cheio; os outros, um pouco apagados
                shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: PontoEvolucao }) => {
                  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
                  const altura = Math.abs(height);
                  const topo = height < 0 ? y + height : y;
                  const r = Math.min(4, width / 2, altura);
                  const base = topo + altura;
                  // cantos arredondados na ponta do dado: em cima se positivo, embaixo se prejuízo
                  const negativo = (payload?.[s.chave] ?? 0) < 0;
                  const d = negativo
                    ? `M${x},${topo} V${base - r} Q${x},${base} ${x + r},${base} H${x + width - r} Q${x + width},${base} ${x + width},${base - r} V${topo} Z`
                    : `M${x},${base} V${topo + r} Q${x},${topo} ${x + r},${topo} H${x + width - r} Q${x + width},${topo} ${x + width},${topo + r} V${base} Z`;
                  return (
                    <path
                      d={d}
                      fill={s.cor}
                      opacity={payload?.escolhido ? 1 : 0.45}
                    />
                  );
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Ver em tabela</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Mês</th>
              <th className="py-1 text-right font-medium">Imposto</th>
              <th className="py-1 text-right font-medium">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.chave} className="border-t border-border">
                <td className="py-1">{p.nomeCompleto}</td>
                <td className="py-1 text-right">{reais(p.imposto)}</td>
                <td className="py-1 text-right">{reais(p.lucro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
