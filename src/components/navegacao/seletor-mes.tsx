import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarioMeses } from "./calendario-meses";

const botao =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-card-muted";
const desligado = "flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground/40";

/**
 * ‹ Agosto de 2026 › — setas para o mês anterior e o próximo.
 * Com `calendario`, o nome do mês abre a grade de meses e anos.
 */
export function SeletorMes({
  rotulo,
  detalhe,
  anterior,
  proximo,
  calendario,
}: {
  rotulo: string;
  detalhe?: string;
  anterior: { href: string; rotulo: string } | null;
  proximo: { href: string; rotulo: string } | null;
  calendario?: Omit<Parameters<typeof CalendarioMeses>[0], "rotulo">;
}) {
  return (
    <div className="flex items-center gap-3">
      {anterior ? (
        <Link href={anterior.href} aria-label={`Ir para ${anterior.rotulo}`} className={botao} scroll={false}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className={desligado} aria-hidden="true">
          <ChevronLeft className="size-5" />
        </span>
      )}

      <div className="min-w-0 flex-1 text-center">
        {calendario ? (
          <CalendarioMeses rotulo={rotulo} {...calendario} />
        ) : (
          <p className="font-display text-lg leading-tight font-bold">{rotulo}</p>
        )}
        {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
      </div>

      {proximo ? (
        <Link href={proximo.href} aria-label={`Ir para ${proximo.rotulo}`} className={botao} scroll={false}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className={desligado} aria-hidden="true">
          <ChevronRight className="size-5" />
        </span>
      )}
    </div>
  );
}
