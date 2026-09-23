"use client";

import { useActionState, useState } from "react";
import { CampoDinheiro } from "@/components/campo-dinheiro";
import { nomeDoMes } from "@/lib/formato";
import { lancarMes } from "./acoes";

const MONOFASICO = [
  { valor: "0", texto: "Quase nada" },
  { valor: "0.2", texto: "Um pouco" },
  { valor: "0.5", texto: "Cerca de metade" },
  { valor: "0.7", texto: "Mais da metade" },
];

const seletor =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

export function FormMes({
  comercio,
  anoPadrao,
  mesPadrao,
}: {
  comercio: boolean;
  anoPadrao: number;
  mesPadrao: number;
}) {
  const [estado, enviar, enviando] = useActionState(lancarMes, {});
  const [mono, setMono] = useState("");

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">Mês de referência</legend>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select name="mes" defaultValue={mesPadrao} aria-label="Mês" className={seletor}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {nomeDoMes(m).charAt(0).toUpperCase() + nomeDoMes(m).slice(1)}
              </option>
            ))}
          </select>
          <select name="ano" defaultValue={anoPadrao} aria-label="Ano" className={seletor}>
            {[anoPadrao - 1, anoPadrao].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <CampoDinheiro id="faturamento" rotulo="Quanto entrou no mês" placeholder="60.000" obrigatorio />
      <CampoDinheiro
        id="folha"
        rotulo="Salários e pró-labore"
        placeholder="12.000"
        dica="Inclua o que os sócios retiram como pró-labore."
      />
      <CampoDinheiro
        id="custos"
        rotulo="Custo total"
        placeholder="20.000"
        dica="Aluguel, fornecedores, mercadorias, contas, sistemas. Sem contar salários e pró-labore."
      />

      {comercio ? (
        <div className="flex flex-col gap-1.5">
          <span id="rotulo-mono" className="text-sm font-semibold">
            Quanto das vendas é de bebidas, cosméticos, remédios, autopeças ou pneus?
          </span>
          <div role="group" aria-labelledby="rotulo-mono" className="grid grid-cols-2 gap-1.5">
            {MONOFASICO.map((o) => (
              <button
                key={o.valor}
                type="button"
                aria-pressed={mono === o.valor}
                onClick={() => setMono(o.valor)}
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
        {enviando ? "Calculando..." : "Ver meu Raio-X"}
      </button>
    </form>
  );
}
