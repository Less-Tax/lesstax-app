"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { marcarMissao, pedirEspecialista } from "@/app/(private)/missoes/acoes";
import type { Missao } from "@/lib/missoes/regras";

const botao = "rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60";

function Acao({ missao }: { missao: Missao }) {
  const [estadoM, marcar, marcando] = useActionState(marcarMissao, {});
  const [estadoE, pedir, pedindo] = useActionState(pedirEspecialista, {});
  const a = missao.acao;
  if (!a) return null;

  if (a.tipo === "link") {
    return (
      <Link href={a.href} className={`${botao} self-start bg-primary text-primary-foreground`}>
        {a.rotulo}
      </Link>
    );
  }

  if (a.tipo === "especialista") {
    return (
      <form action={pedir} className="flex flex-col gap-1.5">
        <button type="submit" disabled={pedindo} className={`${botao} self-start bg-primary text-primary-foreground`}>
          {pedindo ? "Enviando..." : "Pedir contato"}
        </button>
        <p className="text-xs text-muted-foreground">
          A equipe fala com você pelo e-mail ou celular da sua conta.
        </p>
        {estadoE.erro ? <p role="alert" className="text-xs text-destructive">{estadoE.erro}</p> : null}
      </form>
    );
  }

  return (
    <form action={marcar} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="missao" value={a.missao} />
      <button type="submit" disabled={marcando} className={`${botao} bg-primary text-primary-foreground`}>
        {marcando ? "Salvando..." : a.rotulo}
      </button>
      {a.saibaMais ? (
        <Link href={a.saibaMais.href} className={`${botao} border border-border text-foreground`}>
          {a.saibaMais.rotulo}
        </Link>
      ) : null}
      {estadoM.erro ? <p role="alert" className="w-full text-xs text-destructive">{estadoM.erro}</p> : null}
    </form>
  );
}

export function ItemMissao({ missao }: { missao: Missao }) {
  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
          missao.feita ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {missao.feita ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h3 className={`font-semibold ${missao.feita ? "text-muted-foreground line-through decoration-muted-foreground" : ""}`}>
            {missao.titulo}
            <span className="sr-only">{missao.feita ? " (concluída)" : " (pendente)"}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {missao.id === "especialista" && missao.feita ? "Pedido enviado. A equipe da Less Tax vai falar com você." : missao.descricao}
          </p>
        </div>
        {missao.feita ? null : <Acao missao={missao} />}
      </div>
    </li>
  );
}
