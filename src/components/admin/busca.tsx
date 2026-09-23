/** Busca por GET: o termo fica na URL e a página filtra no servidor. */
export function Busca({ valor, dica, extras }: { valor: string; dica: string; extras?: Record<string, string> }) {
  return (
    <form role="search" className="flex gap-2">
      {Object.entries(extras ?? {}).map(([nome, v]) => (
        <input key={nome} type="hidden" name={nome} value={v} />
      ))}
      <input
        name="q"
        defaultValue={valor}
        placeholder={dica}
        aria-label={dica}
        className="w-full max-w-sm rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      />
      <button type="submit" className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold">
        Buscar
      </button>
    </form>
  );
}
