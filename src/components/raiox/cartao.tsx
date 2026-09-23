import type { Cartao as DadosCartao, Tom } from "@/lib/tributario";

const BORDA: Record<Tom, string> = {
  oportunidade: "border-l-6 border-l-imposto",
  positivo: "border-l-6 border-l-lucro",
  alerta: "border-l-6 border-l-destructive",
  neutro: "",
};

export function Cartao({ cartao }: { cartao: DadosCartao }) {
  return (
    <article className={`flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 ${BORDA[cartao.tom]}`}>
      {cartao.etiqueta ? (
        <span className="w-fit rounded-md bg-imposto-soft px-2 py-0.5 text-xs font-semibold">{cartao.etiqueta}</span>
      ) : null}
      <h3 className="font-display text-lg leading-tight font-bold">{cartao.titulo}</h3>
      {cartao.paragrafos.map((texto) => (
        <p key={texto} className="text-sm leading-relaxed">
          {texto}
        </p>
      ))}
      {cartao.destaque ? (
        <div>
          <p className="text-sm text-muted-foreground">{cartao.destaque.rotulo}</p>
          <p className="font-display text-3xl font-bold tabular-nums">{cartao.destaque.valor}</p>
        </div>
      ) : null}
      {cartao.nota ? <p className="text-xs text-muted-foreground">{cartao.nota}</p> : null}
    </article>
  );
}
