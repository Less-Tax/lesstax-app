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
  valorInicial = "",
  obrigatorio = true,
  mascara,
}: {
  id: string;
  rotulo: string;
  tipo?: string;
  autoComplete?: string;
  dica?: string;
  valorInicial?: string;
  obrigatorio?: boolean;
  /** Formata enquanto a pessoa digita (telefone, por exemplo). */
  mascara?: (valor: string) => string;
}) {
  const [valor, setValor] = useState(mascara ? mascara(valorInicial) : valorInicial);

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
        required={obrigatorio}
        value={valor}
        onChange={(e) => setValor(mascara ? mascara(e.target.value) : e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      />
      {dica ? <p className="text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}
