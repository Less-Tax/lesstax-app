"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { quererPremium } from "./acoes";

export function BotaoQueroPremium() {
  const [estado, enviar, enviando] = useActionState(quererPremium, {});

  if (estado.ok) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm font-semibold text-primary">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Pedido recebido! A equipe da Less Tax vai falar com você pelo e-mail ou celular da sua conta para ativar.
      </p>
    );
  }
  return (
    <form action={enviar} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Quero o Premium"}
      </button>
      {estado.erro ? <p role="alert" className="text-sm text-destructive">{estado.erro}</p> : null}
    </form>
  );
}
