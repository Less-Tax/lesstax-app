"use client";

import { useState } from "react";
import { mascaraDinheiro } from "@/lib/validacao/mes";

/** Campo de valor em reais: põe o ponto de milhar enquanto a pessoa digita. */
export function CampoDinheiro({
  id,
  rotulo,
  dica,
  obrigatorio = false,
  placeholder,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  obrigatorio?: boolean;
  placeholder?: string;
}) {
  const [valor, setValor] = useState("");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">R$</span>
        <input
          id={id}
          name={id}
          inputMode="decimal"
          autoComplete="off"
          required={obrigatorio}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => setValor(mascaraDinheiro(e.target.value))}
          className="w-full rounded-lg border border-border bg-card py-2.5 pr-3.5 pl-11 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        />
      </div>
      {dica ? <p className="text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}
