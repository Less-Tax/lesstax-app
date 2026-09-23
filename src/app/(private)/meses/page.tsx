import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { SeletorMes } from "@/components/navegacao/seletor-mes";
import { chave, comparar, lerChave, mesAtual, somar, ultimoMesFechado } from "@/lib/competencia";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { mesesDaEmpresa } from "@/lib/db/meses";
import { simulacoesPorMes } from "@/lib/db/simulacoes";
import { competencia as rotuloCompetencia, nomeDoMes, reais } from "@/lib/formato";
import { FormMes } from "./form-mes";

export const metadata = { title: "Meses — Less Tax" };

export default async function Meses({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; salvo?: string }>;
}) {
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const parametros = await searchParams;
  const limite = mesAtual();
  const pedido = lerChave(parametros.mes);
  // Mês inválido ou no futuro volta para o último mês fechado.
  const atual = pedido && comparar(pedido, limite) <= 0 ? pedido : ultimoMesFechado();

  const [meses, simulacoes] = await Promise.all([mesesDaEmpresa(empresa.id), simulacoesPorMes(empresa.id)]);
  const salvo = meses.find((m) => m.ano === atual.ano && m.mes === atual.mes) ?? null;
  const resultados = new Map(simulacoes.map((s) => [chave(s.entrada), s.resultado]));

  const anterior = somar(atual, -1);
  const proximo = somar(atual, 1);
  const nomeAtual = nomeDoMes(atual.mes);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meses</h1>
        <p className="text-sm text-muted-foreground">
          Lance os números de cada mês. Quanto mais meses, mais o Raio-X mostra.
        </p>
      </div>

      {parametros.salvo ? (
        <div role="status" className="flex flex-col gap-2 rounded-2xl bg-primary-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            {rotuloCompetencia(atual.ano, atual.mes)} salvo.
          </p>
          <div className="flex gap-4">
            <Link href={`/raio-x?mes=${chave(atual)}`} className="font-semibold text-primary underline-offset-4 hover:underline">
              Ver o Raio-X
            </Link>
            <Link href={`/meses?mes=${chave(anterior)}`} className="font-semibold text-primary underline-offset-4 hover:underline">
              Lançar {nomeDoMes(anterior.mes)}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid items-start gap-6 md:grid-cols-[1.3fr_1fr]">
        {/* O mês escolhido */}
        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <SeletorMes
            rotulo={rotuloCompetencia(atual.ano, atual.mes)}
            calendario={{ atual, lancados: meses.map(chave), limite, base: "/meses" }}
            anterior={{ href: `/meses?mes=${chave(anterior)}`, rotulo: rotuloCompetencia(anterior.ano, anterior.mes) }}
            proximo={
              comparar(proximo, limite) <= 0
                ? { href: `/meses?mes=${chave(proximo)}`, rotulo: rotuloCompetencia(proximo.ano, proximo.mes) }
                : null
            }
          />
          <FormMes key={chave(atual)} competencia={atual} valores={salvo} comercio={empresa.atividade === "comercio"} />
          <p className="text-xs text-muted-foreground">Valores aproximados de {nomeAtual} bastam.</p>
        </section>

        {/* Os meses já lançados */}
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold">Lançados</h2>
          {meses.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhum mês ainda. Comece pelo mês que acabou de fechar.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {[...meses].reverse().map((m) => {
                const r = resultados.get(chave(m));
                const escolhido = m.ano === atual.ano && m.mes === atual.mes;
                return (
                  <li key={chave(m)}>
                    <Link
                      href={`/meses?mes=${chave(m)}`}
                      aria-current={escolhido ? "true" : undefined}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-card-muted aria-[current=true]:bg-primary-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{rotuloCompetencia(m.ano, m.mes)}</p>
                        <p className="text-xs text-muted-foreground">
                          Entrou {reais(m.faturamento)}
                          {r && !r.acimaDoTeto ? ` · imposto ${reais(r.imposto)}` : ""}
                        </p>
                      </div>
                      {r ? (
                        <div className="text-right">
                          <p className={`text-sm font-semibold tabular-nums ${r.lucro < 0 ? "text-destructive" : ""}`}>
                            {r.lucro < 0 ? "−" : ""}
                            {reais(Math.abs(r.lucro))}
                          </p>
                          <p className="text-xs text-muted-foreground">{r.lucro < 0 ? "prejuízo" : "lucro"}</p>
                        </div>
                      ) : null}
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
