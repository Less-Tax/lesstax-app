"use client";

import { useActionState, useState } from "react";
import { desfazer, verificar } from "@/app/(admin)/admin/acoes";

const METODOS = { manual: "Manual (conversa/documento)", cpf: "CPF do sócio", pix: "Pix de teste" } as const;

const botao = "rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60";

/**
 * Verificar é um passo de dois cliques: o primeiro mostra o que vai acontecer,
 * o segundo confirma. Evita verificar a empresa errada por um clique solto.
 */
export function AcaoVerificacao({ empresaId, verificada }: { empresaId: string; verificada: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [metodo, setMetodo] = useState<keyof typeof METODOS>("manual");
  const [estadoV, enviarV, verificando] = useActionState(verificar, {});
  const [estadoD, enviarD, desfazendo] = useActionState(desfazer, {});
  const estado = verificada ? estadoD : estadoV;

  if (estado.ok) {
    return (
      <p role="status" className="text-sm font-semibold text-primary">
        {estado.ok}
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`${botao} self-start ${verificada ? "border border-border text-muted-foreground" : "bg-primary text-primary-foreground"}`}
      >
        {verificada ? "Desfazer verificação" : "Verificar"}
      </button>
    );
  }

  if (verificada) {
    return (
      <form action={enviarD} className="flex flex-col gap-2 rounded-lg border border-border bg-card-muted p-3 text-sm">
        <input type="hidden" name="empresa" value={empresaId} />
        <p>A empresa volta a ser não verificada. As cópias que perderam o CNPJ não o recebem de volta.</p>
        {estadoD.erro ? <p role="alert" className="text-destructive">{estadoD.erro}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={desfazendo} className={`${botao} bg-destructive text-primary-foreground`}>
            {desfazendo ? "Desfazendo..." : "Confirmar"}
          </button>
          <button type="button" onClick={() => setAberto(false)} className={`${botao} text-muted-foreground`}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={enviarV} className="flex flex-col gap-2 rounded-lg border border-border bg-card-muted p-3 text-sm">
      <input type="hidden" name="empresa" value={empresaId} />
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Como a posse foi confirmada?</span>
        <select
          name="metodo"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value as keyof typeof METODOS)}
          className="rounded-lg border border-border bg-card px-2 py-1.5"
        >
          {Object.entries(METODOS).map(([chave, texto]) => (
            <option key={chave} value={chave}>
              {texto}
            </option>
          ))}
        </select>
      </label>
      {estadoV.erro ? <p role="alert" className="text-destructive">{estadoV.erro}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={verificando} className={`${botao} bg-primary text-primary-foreground`}>
          {verificando ? "Verificando..." : "Confirmar verificação"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className={`${botao} text-muted-foreground`}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
