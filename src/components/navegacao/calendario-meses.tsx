"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Competencia = { ano: number; mes: number };

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const chave = (ano: number, mes: number) => `${ano}-${String(mes).padStart(2, "0")}`;

/**
 * O nome do mês vira um botão: abre uma grade com os 12 meses do ano e setas
 * para trocar de ano. Meses lançados ganham marca; meses futuros ficam
 * desligados. No Raio-X, só os meses lançados podem ser escolhidos.
 */
export function CalendarioMeses({
  rotulo,
  atual,
  lancados,
  limite,
  base,
  somenteLancados = false,
}: {
  rotulo: string;
  atual: Competencia;
  lancados: string[];
  limite: Competencia;
  base: string;
  somenteLancados?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState(atual.ano);
  const caixa = useRef<HTMLDivElement>(null);
  const feitos = new Set(lancados);
  const lancado = feitos.has(chave(atual.ano, atual.mes));

  // o ano mais antigo que dá para visitar: o primeiro lançado, ou 3 anos atrás
  const primeiroAno = Math.min(limite.ano - 3, ...lancados.map((c) => Number(c.slice(0, 4))));

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative flex justify-center">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => {
          setAno(atual.ano);
          setAberto((a) => !a);
        }}
        className="flex flex-col items-center gap-1 rounded-xl px-3 py-1 hover:bg-card-muted"
      >
        <span className="flex items-center gap-1 font-display text-lg leading-tight font-bold">
          {rotulo}
          <ChevronDown className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
        {lancado ? (
          <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
            <Check className="size-3" aria-hidden="true" />
            Lançado
          </span>
        ) : (
          <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
            Ainda não lançado
          </span>
        )}
      </button>

      {aberto ? (
        <div
          role="dialog"
          aria-label="Escolher mês"
          className="absolute top-full z-30 mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Ano anterior"
              disabled={ano <= primeiroAno}
              onClick={() => setAno((a) => a - 1)}
              className="flex size-9 items-center justify-center rounded-full hover:bg-card-muted disabled:opacity-30"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="font-display text-base font-bold">{ano}</span>
            <button
              type="button"
              aria-label="Próximo ano"
              disabled={ano >= limite.ano}
              onClick={() => setAno((a) => a + 1)}
              className="flex size-9 items-center justify-center rounded-full hover:bg-card-muted disabled:opacity-30"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>

          <ul className="grid grid-cols-3 gap-1.5">
            {MESES.map((nome, i) => {
              const mes = i + 1;
              const c = chave(ano, mes);
              const futuro = ano * 12 + mes > limite.ano * 12 + limite.mes;
              const feito = feitos.has(c);
              const escolhido = ano === atual.ano && mes === atual.mes;
              const desligado = futuro || (somenteLancados && !feito);
              const estilo = escolhido
                ? "bg-primary text-primary-foreground font-bold"
                : feito
                  ? "bg-primary-soft text-primary font-semibold hover:ring-2 hover:ring-primary/40"
                  : "hover:bg-card-muted";

              return (
                <li key={c}>
                  {desligado ? (
                    <span className="flex h-11 items-center justify-center rounded-lg text-sm text-muted-foreground/40">
                      {nome}
                    </span>
                  ) : (
                    <Link
                      href={`${base}?mes=${c}`}
                      scroll={false}
                      onClick={() => setAberto(false)}
                      aria-current={escolhido ? "date" : undefined}
                      aria-label={`${nome} de ${ano}${feito ? ", lançado" : ""}`}
                      className={`relative flex h-11 items-center justify-center rounded-lg text-sm ${estilo}`}
                    >
                      {nome}
                      {feito && !escolhido ? (
                        <Check className="absolute top-1 right-1 size-3" aria-hidden="true" />
                      ) : null}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
            <span className="inline-flex size-4 items-center justify-center rounded bg-primary-soft text-primary">
              <Check className="size-3" aria-hidden="true" />
            </span>
            {somenteLancados ? "Só os meses lançados aparecem no Raio-X" : "Meses já lançados"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
