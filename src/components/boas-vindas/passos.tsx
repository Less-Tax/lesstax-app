import { Check } from "lucide-react";

const PASSOS = ["Sua empresa", "Primeiro mês", "Seu Raio-X"];

/** Os três passos do primeiro acesso. `atual` é o índice do passo em andamento (3 = todos feitos). */
export function Passos({ atual }: { atual: number }) {
  return (
    <ol aria-label="Primeiros passos" className="flex items-center gap-2 text-xs font-semibold">
      {PASSOS.map((rotulo, i) => {
        const feito = i < atual;
        const agora = i === atual;
        return (
          <li key={rotulo} className="flex items-center gap-2" aria-current={agora ? "step" : undefined}>
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                feito
                  ? "border-primary bg-primary text-primary-foreground"
                  : agora
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
              }`}
            >
              {feito ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={agora ? "text-foreground" : "text-muted-foreground"}>
              {rotulo}
              {feito ? <span className="sr-only"> (feito)</span> : null}
            </span>
            {i < PASSOS.length - 1 ? <span aria-hidden="true" className="h-px w-4 bg-border sm:w-8" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
