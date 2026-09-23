"use client";

import { useActionState, useState } from "react";
import { CampoDinheiro } from "@/components/campo-dinheiro";
import type { Competencia } from "@/lib/competencia";
import { lancarMes } from "./acoes";

const MONOFASICO = [
  { valor: 0, texto: "Quase nada" },
  { valor: 0.2, texto: "Um pouco" },
  { valor: 0.5, texto: "Cerca de metade" },
  { valor: 0.7, texto: "Mais da metade" },
];

type Valores = { faturamento: number; folha: number; custos: number; monofasico: number };

/**
 * Formulário de um mês. A tela monta um novo a cada troca de mês (key), então
 * os campos sempre começam com o que está salvo para aquele mês.
 */
export function FormMes({
  competencia,
  valores,
  comercio,
}: {
  competencia: Competencia;
  valores: Valores | null;
  comercio: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(lancarMes, {});
  const [mono, setMono] = useState(valores ? String(valores.monofasico) : "");

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <input type="hidden" name="ano" value={competencia.ano} />
      <input type="hidden" name="mes" value={competencia.mes} />

      <CampoDinheiro id="faturamento" rotulo="Quanto entrou no mês" placeholder="60.000" obrigatorio valorInicial={valores?.faturamento} />
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoDinheiro
          id="folha"
          rotulo="Salários e pró-labore"
          placeholder="12.000"
          dica="Inclua o pró-labore dos sócios."
          valorInicial={valores?.folha}
        />
        <CampoDinheiro
          id="custos"
          rotulo="Custo total"
          placeholder="20.000"
          dica="Aluguel, fornecedores, mercadorias, contas."
          valorInicial={valores?.custos}
        />
      </div>

      {comercio ? (
        <div className="flex flex-col gap-1.5">
          <span id="rotulo-mono" className="text-sm font-semibold">
            Quanto das vendas é de bebidas, cosméticos, remédios, autopeças ou pneus?
          </span>
          <div role="group" aria-labelledby="rotulo-mono" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {MONOFASICO.map((o) => (
              <button
                key={o.valor}
                type="button"
                aria-pressed={mono === String(o.valor)}
                onClick={() => setMono(String(o.valor))}
                className="rounded-lg border border-border bg-card px-2 py-2.5 text-sm aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:font-semibold aria-pressed:text-primary"
              >
                {o.texto}
              </button>
            ))}
          </div>
          <input type="hidden" name="monofasico" value={mono} />
        </div>
      ) : null}

      {estado.erro ? (
        <p role="alert" className="text-sm text-destructive">
          {estado.erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {enviando ? "Salvando..." : valores ? "Atualizar mês" : "Salvar mês"}
      </button>
    </form>
  );
}
