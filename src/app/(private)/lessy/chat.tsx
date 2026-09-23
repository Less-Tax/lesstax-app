"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, History, RotateCcw } from "lucide-react";
import { perguntar } from "./acoes";

type Mensagem = { id: string; papel: "user" | "assistant"; conteudo: string };

const MAX = 500;

function Avatar() {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary"
    >
      L
    </span>
  );
}

function Bolha({ m }: { m: Mensagem }) {
  if (m.papel === "user") {
    return (
      <li className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 whitespace-pre-line text-primary-foreground">
          {m.conteudo}
        </p>
      </li>
    );
  }
  return (
    <li className="flex items-end gap-2">
      <Avatar />
      <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 leading-relaxed whitespace-pre-line">
        {m.conteudo}
      </p>
    </li>
  );
}

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" });

export function Chat({
  conversaInicial,
  historico,
  restantesInicial,
  limite,
  gratuito,
  mes,
  sugestoes,
}: {
  conversaInicial: { id: string; mensagens: Mensagem[] } | null;
  historico: { id: string; titulo: string; criadaEm: string }[];
  restantesInicial: number;
  limite: number;
  gratuito: boolean;
  mes: string;
  sugestoes: string[];
}) {
  const [conversaId, setConversaId] = useState<string | null>(conversaInicial?.id ?? null);
  const [mensagens, setMensagens] = useState<Mensagem[]>(conversaInicial?.mensagens ?? []);
  const [restantes, setRestantes] = useState(restantesInicial);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [pensando, iniciar] = useTransition();
  const fim = useRef<HTMLDivElement>(null);
  const contador = useRef(0);
  const router = useRouter();

  // Mensagem nova: rola até o fim.
  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens.length, pensando]);

  const esgotado = restantes <= 0;

  function enviar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || pensando || esgotado) return;
    setErro("");
    setTexto("");
    const provisoria: Mensagem = { id: `local-${(contador.current += 1)}`, papel: "user", conteudo: limpa };
    setMensagens((atual) => [...atual, provisoria]);

    iniciar(async () => {
      const r = await perguntar(conversaId, limpa);
      if (r.restantes !== undefined) setRestantes(r.restantes);
      if (!r.ok) {
        // A pergunta não foi respondida: sai da tela e volta para a caixa.
        setMensagens((atual) => atual.filter((m) => m.id !== provisoria.id));
        setTexto(limpa);
        setErro(r.erro);
        return;
      }
      setConversaId(r.conversaId);
      setMensagens((atual) => [...atual, { id: `${provisoria.id}-r`, papel: "assistant", conteudo: r.resposta }]);
      router.refresh(); // atualiza a lista de conversas

    });
  }


  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar />
          <div>
            <h1 className="font-display text-2xl leading-tight font-bold">Lessy</h1>
            <p className="text-sm text-muted-foreground">Pergunte sobre os impostos da sua empresa.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${esgotado ? "bg-imposto-soft" : "bg-primary-soft text-primary"}`}
          >
            {restantes} de {limite} {limite === 1 ? "pergunta" : "perguntas"} em {mes}
          </span>
          {mensagens.length > 0 ? (
            <Link
              href="/lessy?nova=1"
              aria-disabled={pensando}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-60"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Nova conversa
            </Link>
          ) : null}
        </div>
      </div>

      {historico.length > 0 ? (
        <details className="group rounded-2xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-semibold">
            <History className="size-4 text-muted-foreground" aria-hidden="true" />
            Conversas anteriores
            <span className="text-muted-foreground">({historico.length})</span>
          </summary>
          <ul className="rolagem-fina max-h-64 overflow-y-auto border-t border-border">
            {historico.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/lessy?conversa=${c.id}`}
                  aria-current={c.id === conversaId ? "true" : undefined}
                  className="flex items-baseline justify-between gap-3 px-4 py-2 text-sm hover:bg-card-muted aria-[current=true]:bg-primary-soft"
                >
                  <span className="truncate">{c.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{dataCurta(c.criadaEm)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <section aria-label="Conversa com o Lessy" className="flex flex-1 flex-col gap-4">
        {mensagens.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <Avatar />
              <p className="leading-relaxed">
                Oi! Eu sou o Lessy. Já conheço os números que você lançou, então pode perguntar direto sobre o seu
                imposto, seu Fator R ou a reforma tributária.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {sugestoes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  disabled={pensando || esgotado}
                  className="rounded-full border border-border bg-card-muted px-3 py-1.5 text-left text-sm hover:border-primary disabled:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-3" aria-live="polite">
            {mensagens.map((m) => (
              <Bolha key={m.id} m={m} />
            ))}
            {pensando ? (
              <li className="flex items-end gap-2">
                <Avatar />
                <p className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-muted-foreground">
                  <span className="animate-pulse">Pensando…</span>
                </p>
              </li>
            ) : null}
          </ol>
        )}
        <div ref={fim} />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="sticky bottom-20 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-lg md:bottom-4"
      >
        {erro ? (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        ) : null}
        {esgotado && !erro ? (
          <p className="text-sm">
            {gratuito
              ? `Você usou as ${limite} perguntas grátis de ${mes}. No mês que vem tem mais.`
              : "Você chegou ao limite de perguntas deste mês."}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor="pergunta" className="sr-only">
            Sua pergunta
          </label>
          <textarea
            id="pergunta"
            rows={2}
            maxLength={MAX}
            value={texto}
            disabled={esgotado}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(texto);
              }
            }}
            placeholder={esgotado ? "Sem perguntas neste mês" : "Escreva sua pergunta"}
            className="min-h-11 flex-1 resize-none rounded-lg bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pensando || esgotado || !texto.trim()}
            aria-label="Enviar pergunta"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </div>
        <p className="px-2 text-xs text-muted-foreground">
          O Lessy usa os números que você lançou e faz estimativas. Para decisões, fale com seu contador.
          {texto.length > MAX - 100 ? ` ${texto.length}/${MAX}` : ""}
        </p>
      </form>
    </>
  );
}
