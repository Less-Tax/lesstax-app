"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Erro inesperado numa tela logada. Mostra uma mensagem simples — nunca o
 * erro técnico, que pode ter detalhe do servidor. O detalhe fica no console.
 */
export default function ErroPrivado({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Algo não saiu como esperado</h1>
      <p className="text-muted-foreground">
        Não conseguimos carregar esta tela agora. Seus dados estão salvos — tente de novo em instantes.
      </p>
      {error.digest ? <p className="text-xs text-muted-foreground">Código: {error.digest}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground"
        >
          Tentar de novo
        </button>
        <Link href="/raio-x" className="rounded-xl border border-border bg-card px-4 py-2.5 font-semibold">
          Ir para o Raio-X
        </Link>
      </div>
    </main>
  );
}
