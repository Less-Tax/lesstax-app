/** Enquanto a tela carrega: o esqueleto dos cartões, sem pular o layout. */
export default function Carregando() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <span className="sr-only" role="status">
        Carregando…
      </span>
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-lg bg-card" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </main>
  );
}
