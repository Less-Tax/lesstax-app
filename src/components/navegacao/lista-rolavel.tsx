"use client";

import { useEffect, useRef } from "react";

/**
 * Lista com rolagem própria que, ao abrir, rola até o item escolhido
 * (aria-current). Rola só a lista — a página fica parada.
 */
export function ListaRolavel({ className, children }: { className?: string; children: React.ReactNode }) {
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const caixa = lista.current;
    const item = caixa?.querySelector<HTMLElement>("[aria-current]");
    if (!caixa || !item) return;
    const topo = item.offsetTop; // a lista é `relative`, então o topo é medido a partir dela
    if (topo < caixa.scrollTop || topo + item.offsetHeight > caixa.scrollTop + caixa.clientHeight) {
      caixa.scrollTop = topo - caixa.clientHeight / 2 + item.offsetHeight / 2;
    }
  });

  return (
    <ul ref={lista} className={`relative ${className ?? ""}`}>
      {children}
    </ul>
  );
}
