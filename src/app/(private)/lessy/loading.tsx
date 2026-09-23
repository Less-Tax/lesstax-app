import { Linha } from "@/components/esqueleto";

/** Lessy: lateral de conversas, cabeçalho, balões e a caixa de pergunta. */
export default function CarregandoLessy() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-6xl flex-1 px-4">
      <span className="sr-only" role="status">
        Carregando…
      </span>
      <div className="flex h-[calc(100dvh-8.5rem)] w-full gap-6 py-4 md:h-[calc(100dvh-3.5rem)]">
        <div className="hidden w-64 shrink-0 flex-col gap-3 md:flex">
          <Linha className="h-10 w-full rounded-xl" />
          {[0, 1, 2, 3].map((i) => (
            <Linha key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <Linha className="size-8 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Linha className="h-6 w-24" />
              <Linha className="h-4 w-60 max-w-full" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <Linha className="h-11 w-2/3 self-end rounded-2xl" />
            <div className="flex items-end gap-2">
              <Linha className="size-8 shrink-0 rounded-full" />
              <Linha className="h-32 w-4/5 rounded-2xl" />
            </div>
            <Linha className="h-11 w-1/2 self-end rounded-2xl" />
          </div>
          <Linha className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
