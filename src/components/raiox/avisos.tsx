import { AlertTriangle, Info } from "lucide-react";
import type { Aviso } from "@/lib/tributario";

/**
 * Avisos de sublimite e teto do Simples, medidos pela receita do ano.
 * No lugar de "não calculo": o imposto segue calculado e isto orienta.
 */
export function AvisosLimite({ avisos }: { avisos: readonly Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <section aria-label="Limites do Simples" className="flex flex-col gap-2">
      {avisos.map((a) => {
        const alerta = a.nivel === "alerta";
        const Icone = alerta ? AlertTriangle : Info;
        return (
          <div
            key={a.id}
            role={alerta ? "alert" : "status"}
            className={`flex gap-3 rounded-2xl border p-4 text-sm ${
              alerta ? "border-l-4 border-border border-l-imposto bg-imposto-soft" : "border-border bg-card"
            }`}
          >
            <Icone className={`mt-0.5 size-4 shrink-0 ${alerta ? "" : "text-muted-foreground"}`} aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{a.titulo}</p>
              <p className="leading-relaxed">{a.texto}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
