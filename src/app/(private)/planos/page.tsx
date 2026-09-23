import { redirect } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { usuarioAtual } from "@/lib/auth/usuario";
import { BENEFICIOS, ehPremium, PRECO_PREMIUM } from "@/lib/planos/regras";
import { planoDe } from "@/lib/planos/servidor";
import { BotaoQueroPremium } from "./botao";

export const metadata = { title: "Planos — Less Tax" };

function Valor({ v }: { v: string | false }) {
  if (v === false) return <Minus className="size-4 text-muted-foreground" aria-label="Não incluso" />;
  if (v === "Sim") return <Check className="size-4 text-primary" aria-label="Incluso" />;
  return <span>{v}</span>;
}

export default async function Planos() {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  const premium = ehPremium(await planoDe(usuario.id));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Planos</h1>
        <p className="text-sm text-muted-foreground">Comece grátis. Assine quando quiser acompanhar tudo, todo mês.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gratuito */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h2 className="font-display text-xl font-bold">Gratuito</h2>
            <p className="font-display text-3xl font-bold">R$ 0</p>
            <p className="text-sm text-muted-foreground">Para descobrir quanto do que entra vira imposto.</p>
          </div>
          {!premium ? (
            <p className="rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
              Seu plano atual
            </p>
          ) : null}
        </section>

        {/* Premium */}
        <section className="flex flex-col gap-4 rounded-2xl border-2 border-primary bg-card p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold">Premium</h2>
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">Mais completo</span>
            </div>
            <p className="font-display text-3xl font-bold">
              {PRECO_PREMIUM}
              <span className="text-base font-normal text-muted-foreground">/mês</span>
            </p>
            <p className="text-sm text-muted-foreground">Acompanhamento mês a mês, avisos e alguém para perguntar.</p>
          </div>
          {premium ? (
            <p className="rounded-xl bg-primary-soft px-4 py-3 text-center text-sm font-semibold text-primary">
              Seu plano atual
            </p>
          ) : (
            <BotaoQueroPremium />
          )}
        </section>
      </div>

      <section aria-label="Comparação dos planos" className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">O que tem</th>
              <th scope="col" className="w-40 px-4 py-3 font-semibold">Gratuito</th>
              <th scope="col" className="w-48 px-4 py-3 font-semibold text-primary">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {BENEFICIOS.map((b) => (
              <tr key={b.texto}>
                <th scope="row" className="px-4 py-3 font-normal">
                  {b.texto}
                  {b.emBreve ? (
                    <span className="ml-2 rounded-md bg-imposto-soft px-1.5 py-0.5 text-xs font-semibold">em breve</span>
                  ) : null}
                </th>
                <td className="px-4 py-3">
                  <Valor v={b.gratis} />
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Valor v={b.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Por enquanto a assinatura é ativada pela equipe, depois de uma conversa rápida. O pagamento pelo app vem em
        breve.
      </p>
    </main>
  );
}
