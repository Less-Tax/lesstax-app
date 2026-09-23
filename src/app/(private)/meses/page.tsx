import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Passos } from "@/components/boas-vindas/passos";
import { ListaRolavel } from "@/components/navegacao/lista-rolavel";
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
  searchParams: Promise<{ mes?: string; salvo?: string; apagado?: string }>;
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
  const primeiroAcesso = meses.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      {primeiroAcesso ? (
        <div className="flex flex-col gap-4">
          <Passos atual={1} />
          <div>
            <h1 className="font-display text-2xl font-bold">Agora, o primeiro mês</h1>
            <p className="text-sm text-muted-foreground">
              Lance o que entrou e saiu em {nomeAtual}. Valores aproximados bastam — dá para corrigir depois. Com
              ele, o Raio-X já mostra seu imposto.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-display text-2xl font-bold">Meses</h1>
          <p className="text-sm text-muted-foreground">
            Lance os números de cada mês. Quanto mais meses, mais o Raio-X mostra.
          </p>
        </div>
      )}

      {parametros.apagado && !salvo ? (
        <p role="status" className="rounded-2xl border border-border bg-card p-4 text-sm">
          {rotuloCompetencia(atual.ano, atual.mes)} apagado. Os meses seguintes tiveram a conta refeita.
        </p>
      ) : null}

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

      <div className={primeiroAcesso ? "grid max-w-xl gap-6" : "grid items-start gap-6 md:grid-cols-[1.3fr_1fr] md:items-stretch"}>
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

        {primeiroAcesso ? null : (
          <>
        {/* Os meses já lançados */}
        {/* No computador, a altura acompanha o cartão do formulário (h-0 + min-h-full)
            e a lista rola por dentro. No celular, a lista tem altura máxima. */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card md:h-0 md:min-h-full">
          <div className="flex items-baseline justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-lg font-bold">Lançados</h2>
            {meses.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {meses.length} {meses.length === 1 ? "mês" : "meses"}
              </span>
            ) : null}
          </div>
          {meses.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum mês ainda. Comece pelo mês que acabou de fechar.</p>
          ) : (
            <ListaRolavel className="rolagem-fina flex max-h-96 flex-col divide-y divide-border overflow-y-auto overscroll-contain md:max-h-none md:flex-1">
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
                          <span className="whitespace-nowrap">Entrou {reais(m.faturamento)}</span>
                          {r ? <> <span className="whitespace-nowrap">· imposto {reais(r.imposto)}</span></> : null}
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
            </ListaRolavel>
          )}
        </section>
          </>
        )}
      </div>
    </main>
  );
}
