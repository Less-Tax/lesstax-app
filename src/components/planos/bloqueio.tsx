import Link from "next/link";
import { Lock } from "lucide-react";
import { PRECO_PREMIUM } from "@/lib/planos/regras";

/** Lugar de um recurso do Premium: diz o que é e leva para a tela de planos. */
export function BloqueioPremium({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-5">
      <span className="flex items-center gap-1.5 rounded-full bg-imposto-soft px-2.5 py-1 text-xs font-semibold">
        <Lock className="size-3.5" aria-hidden="true" />
        Premium
      </span>
      <div>
        <h3 className="font-display text-lg font-bold">{titulo}</h3>
        <p className="text-sm text-muted-foreground">{texto}</p>
      </div>
      <Link href="/planos" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        Conhecer o Premium · {PRECO_PREMIUM}/mês
      </Link>
    </div>
  );
}
