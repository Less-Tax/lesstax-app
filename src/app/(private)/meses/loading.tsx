import { Cabecalho, Linha } from "@/components/esqueleto";

/** Meses: o formulário do mês à esquerda e a lista de lançados à direita. */
export default function CarregandoMeses() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Cabecalho />
      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Linha className="size-11 rounded-full bg-card-muted" />
            <Linha className="h-6 w-40 bg-card-muted" />
            <Linha className="size-11 rounded-full bg-card-muted" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Linha className="h-4 w-36 bg-card-muted" />
              <Linha className="h-11 w-full bg-card-muted" />
            </div>
          ))}
          <Linha className="h-12 w-full bg-card-muted" />
        </div>
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <Linha className="h-6 w-28 bg-card-muted" />
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <div className="flex flex-col gap-1.5">
                <Linha className="h-4 w-32 bg-card-muted" />
                <Linha className="h-3 w-40 bg-card-muted" />
              </div>
              <Linha className="h-4 w-16 bg-card-muted" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
