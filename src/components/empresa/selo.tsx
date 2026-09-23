import { BadgeCheck } from "lucide-react";

/** Selo de empresa verificada: o mesmo na Conta e no Raio-X. */
export function SeloVerificada({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-sans text-xs font-semibold text-primary ${className}`}
    >
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      Verificada
    </span>
  );
}
