/** Peças da tela de carregamento. Cada aba monta o seu formato com elas. */
export function Bloco({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-border bg-card ${className}`} />;
}

export function Linha({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-card ${className}`} />;
}

/** Título + subtítulo e o aviso para leitor de tela. */
export function Cabecalho() {
  return (
    <>
      <span className="sr-only" role="status">
        Carregando…
      </span>
      <div className="flex flex-col gap-2">
        <Linha className="h-7 w-48" />
        <Linha className="h-4 w-72 max-w-full" />
      </div>
    </>
  );
}
