import { Linha } from "@/components/esqueleto";

/** Lessy: cabeçalho com avatar, balões de conversa e a caixa de pergunta. */
export default function CarregandoLessy() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <span className="sr-only" role="status">
        Carregando…
      </span>
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
        <div className="flex items-end gap-2">
          <Linha className="size-8 shrink-0 rounded-full" />
          <Linha className="h-20 w-3/5 rounded-2xl" />
        </div>
      </div>
      <Linha className="h-28 w-full rounded-2xl" />
    </main>
  );
}
