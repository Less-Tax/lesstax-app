import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { porcento, reais } from "@/lib/formato";

type Comparacao = { valor: number; mes: string } | null;

/** "R$ 500 a mais que julho" — sem cor de bom/ruim: a pessoa julga. */
function Variacao({ atual, antes, emReais = true }: { atual: number; antes: Comparacao; emReais?: boolean }) {
  if (!antes) return null;
  const diferenca = atual - antes.valor;
  const igual = emReais ? Math.abs(diferenca) < 1 : Math.abs(diferenca) < 0.0005;
  const Icone = igual ? Minus : diferenca > 0 ? ArrowUpRight : ArrowDownRight;
  const texto = igual
    ? `igual a ${antes.mes}`
    : emReais
      ? `${reais(Math.abs(diferenca))} a ${diferenca > 0 ? "mais" : "menos"} que ${antes.mes}`
      : `era ${porcento(antes.valor)} em ${antes.mes}`;
  return (
    <p className="flex items-center gap-1 text-xs opacity-80">
      <Icone className="size-3.5 shrink-0" aria-hidden="true" />
      {texto}
    </p>
  );
}

/** O número grande do topo, como o saldo num app de banco. */
export function Principal({
  rotulo,
  valor,
  apoio,
  antes,
}: {
  rotulo: string;
  valor: number;
  apoio: string;
  antes: Comparacao;
}) {
  return (
    <section className="flex flex-col gap-1 rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6">
      <p className="text-sm font-semibold opacity-90">{rotulo}</p>
      <p className="font-display text-4xl font-bold tabular-nums sm:text-5xl">{reais(valor)}</p>
      <p className="text-sm opacity-90">{apoio}</p>
      <Variacao atual={valor} antes={antes} />
    </section>
  );
}

/** Os números menores logo abaixo. */
export function Numero({
  rotulo,
  valor,
  antes,
  tipo = "reais",
  negativoEmDestaque = false,
}: {
  rotulo: string;
  valor: number;
  antes: Comparacao;
  tipo?: "reais" | "porcento";
  negativoEmDestaque?: boolean;
}) {
  const texto = tipo === "porcento" ? porcento(valor) : `${valor < 0 ? "−" : ""}${reais(Math.abs(valor))}`;
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border bg-card p-3.5">
      <p className="text-xs font-semibold text-muted-foreground">{rotulo}</p>
      <p
        className={`font-display text-xl font-bold tabular-nums sm:text-2xl ${negativoEmDestaque && valor < 0 ? "text-destructive" : ""}`}
      >
        {texto}
      </p>
      <div className="text-muted-foreground">
        <Variacao atual={valor} antes={antes} emReais={tipo === "reais"} />
      </div>
    </div>
  );
}
