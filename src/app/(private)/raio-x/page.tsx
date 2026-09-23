import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraRaioX } from "@/components/raiox/barra";
import { Cartao } from "@/components/raiox/cartao";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { ultimaSimulacao } from "@/lib/db/simulacoes";
import { competencia } from "@/lib/formato";
import { manchete, oportunidades, rotuloRegime } from "@/lib/tributario";
import { mascaraCnpj } from "@/lib/validacao/cnpj";

export const metadata = { title: "Raio-X — Less Tax" };

export default async function RaioX() {
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const simulacao = await ultimaSimulacao(empresa.id);
  if (!simulacao) redirect("/meses/novo");

  // Mostra o que foi calculado e guardado — não recalcula. Se a regra mudar,
  // o cliente continua vendo o número que viu da primeira vez.
  const { entrada, resultado } = simulacao;
  const cartoes = oportunidades({
    entrada,
    resultado,
    clientes: (empresa.clientes as "pf" | "pj" | "ambos" | null) ?? null,
    regime: empresa.regime,
    hoje: new Date(),
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-7 px-4 py-6">
      {/* Cabeçalho da empresa */}
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{rotuloRegime(resultado)}</p>
        <h1 className="font-display text-3xl leading-tight font-bold">{empresa.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {[empresa.cnpj ? `CNPJ ${mascaraCnpj(empresa.cnpj)}` : null, competencia(entrada.ano, entrada.mes)]
            .filter(Boolean)
            .join(" · ")}
          {empresa.verificada_em ? (
            <span className="ml-2 font-semibold text-primary">✓ verificada</span>
          ) : null}
        </p>
      </section>

      {empresa.cnpj_removido_em && !empresa.cnpj ? (
        <div role="status" className="flex flex-col gap-1 rounded-xl border-l-4 border-l-imposto bg-imposto-soft p-3.5 text-sm">
          <p className="font-semibold">O CNPJ foi removido desta empresa</p>
          <p>
            Outra conta confirmou ser a dona desse CNPJ. Os números que você lançou continuam salvos.
            Se você faz parte da empresa, peça ao responsável para convidar você.
          </p>
        </div>
      ) : null}

      {/* A barra */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">De cada R$ 100 que entram</h2>
        <BarraRaioX entrada={entrada} resultado={resultado} />
      </section>

      <p className="font-display text-xl leading-snug font-semibold">{manchete({ entrada, resultado })}</p>

      {/* Oportunidades e alertas */}
      {cartoes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold">O que olhar agora</h2>
          {cartoes.map((c) => (
            <Cartao key={c.id} cartao={c} />
          ))}
        </section>
      ) : null}

      <div className="flex flex-col gap-2">
        <Link
          href="/meses/novo"
          className="rounded-xl border border-primary px-4 py-3 text-center font-semibold text-primary"
        >
          Lançar outro mês
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Estimativas com as tabelas do Simples Nacional ({resultado.regrasVersao}). Não substituem a análise de um
          contador.
        </p>
      </div>
    </main>
  );
}
