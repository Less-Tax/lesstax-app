import { corDaSaude } from "@/lib/missoes/regras";

/** Anel da saúde tributária (0 a 100), com a cor indo do vermelho ao verde. */
export function Anel({ pontos, tamanho = 112 }: { pontos: number; tamanho?: number }) {
  const raio = 44;
  const volta = 2 * Math.PI * raio;
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`Saúde tributária: ${pontos} de 100`}>
        <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={raio}
          fill="none"
          stroke={corDaSaude(pontos)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(pontos / 100) * volta} ${volta}`}
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-display font-bold tabular-nums"
        style={{ fontSize: tamanho * 0.28 }}
      >
        {pontos}
      </span>
    </div>
  );
}
