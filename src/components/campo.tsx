"use client";

import { useState } from "react";

/**
 * Campo de texto que mantém o que foi digitado.
 * O React 19 limpa o formulário depois de uma ação; com estado próprio,
 * o valor sobrevive a um erro voltando do servidor.
 */
export function Campo({
  id,
  rotulo,
  tipo = "text",
  autoComplete,
  dica,
}: {
  id: string;
  rotulo: string;
  tipo?: string;
  autoComplete?: string;
  dica?: string;
}) {
  const [valor, setValor] = useState("");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        autoComplete={autoComplete}
        required
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/40 dark:border-white/20 dark:bg-white/5"
      />
      {dica ? <p className="text-xs text-black/55 dark:text-white/55">{dica}</p> : null}
    </div>
  );
}
