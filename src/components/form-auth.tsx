"use client";

import { useActionState } from "react";
import type { EstadoForm } from "@/lib/auth/acoes";

export function FormAuth({
  acao,
  botao,
  children,
}: {
  acao: (anterior: EstadoForm, dados: FormData) => Promise<EstadoForm>;
  botao: string;
  children: React.ReactNode;
}) {
  const [estado, enviar, enviando] = useActionState(acao, {});

  return (
    <form action={enviar} className="flex flex-col gap-4">
      {children}

      {estado.erro ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {estado.erro}
        </p>
      ) : null}
      {estado.aviso ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          {estado.aviso}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {enviando ? "Um instante..." : botao}
      </button>
    </form>
  );
}
