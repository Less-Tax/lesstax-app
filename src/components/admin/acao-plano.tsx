"use client";

import { useActionState, useState } from "react";
import { mudarPlano } from "@/app/(admin)/admin/acoes";

const botao = "rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-60";

/** Ativar ou desativar o Premium de uma pessoa, na mão. */
export function AcaoPlano({ perfilId, premium }: { perfilId: string; premium: boolean }) {
  const [estado, enviar, enviando] = useActionState(mudarPlano, {});
  const [aberto, setAberto] = useState(false);

  if (estado.ok) return <p role="status" className="text-xs font-semibold text-primary">{estado.ok}</p>;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`${botao} ${premium ? "border border-border text-muted-foreground" : "bg-primary-soft text-primary"}`}
      >
        {premium ? "Desativar" : "Ativar Premium"}
      </button>
    );
  }

  return (
    <form action={enviar} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="perfil" value={perfilId} />
      <input type="hidden" name="acao" value={premium ? "desativar" : "ativar"} />
      {premium ? null : (
        <select name="dias" defaultValue="30" aria-label="Por quanto tempo" className="rounded-lg border border-border bg-card px-1.5 py-1 text-xs">
          <option value="30">30 dias</option>
          <option value="365">1 ano</option>
          <option value="sempre">Sem prazo</option>
        </select>
      )}
      <button
        type="submit"
        disabled={enviando}
        className={`${botao} ${premium ? "bg-destructive text-primary-foreground" : "bg-primary text-primary-foreground"}`}
      >
        {enviando ? "..." : "Confirmar"}
      </button>
      <button type="button" onClick={() => setAberto(false)} className={`${botao} text-muted-foreground`}>
        Cancelar
      </button>
      {estado.erro ? <p role="alert" className="w-full text-xs text-destructive">{estado.erro}</p> : null}
    </form>
  );
}
