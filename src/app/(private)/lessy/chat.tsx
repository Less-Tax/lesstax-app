"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, History, Plus } from "lucide-react";
import { perguntar } from "./acoes";

type Mensagem = { id: string; papel: "user" | "assistant"; conteudo: string };
type Resumo = { id: string; titulo: string; criadaEm: string };

const MAX = 500;
const ALTURA_MAX = 200; // px: a caixa cresce até aqui e depois rola

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" });

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

/** Lista de conversas: na lateral no computador, recolhida no celular. */
function ListaConversas({ historico, atual }: { historico: Resumo[]; atual: string | null }) {
  if (historico.length === 0) {
    return <p className="px-3 text-sm text-muted-foreground">Suas conversas aparecem aqui.</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {historico.map((c) => (
        <li key={c.id}>
          <Link
            href={`/lessy?conversa=${c.id}`}
            aria-current={c.id === atual ? "true" : undefined}
            className="flex flex-col rounded-lg px-3 py-2 text-sm hover:bg-card-muted aria-[current=true]:bg-primary-soft"
          >
            <span className="truncate">{c.titulo}</span>
            <span className="text-xs text-muted-foreground">{dataCurta(c.criadaEm)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const botaoNova =
  "flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:border-primary";

export function Chat({
  conversaInicial,
  historico,
  perguntaInicial = "",
  restantesInicial,
  limite,
  gratuito,
  mes,
  sugestoes,
}: {
  conversaInicial: { id: string; mensagens: Mensagem[] } | null;
  historico: Resumo[];
  /** Pergunta sugerida por outra tela (ex.: Missões). Fica na caixa; a pessoa decide enviar. */
  perguntaInicial?: string;
  restantesInicial: number;
  limite: number;
  gratuito: boolean;
  mes: string;
  sugestoes: string[];
}) {
  const [conversaId, setConversaId] = useState<string | null>(conversaInicial?.id ?? null);
  const [mensagens, setMensagens] = useState<Mensagem[]>(conversaInicial?.mensagens ?? []);
  const [restantes, setRestantes] = useState(restantesInicial);
  const [texto, setTexto] = useState(perguntaInicial);
  const [erro, setErro] = useState("");
  const [pensando, iniciar] = useTransition();
  const rolagem = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const contador = useRef(0);
  const router = useRouter();

  // A conversa abre no fim e, a cada mensagem nova, rola até ela (só a conversa, não a página).
  const abriu = useRef(false);
  useEffect(() => {
    const r = rolagem.current;
    if (!r) return;
    r.scrollTo({ top: r.scrollHeight, behavior: abriu.current ? "smooth" : "auto" });
    abriu.current = true;
  }, [mensagens.length, pensando]);

  // A caixa cresce com o texto, até ALTURA_MAX.
  useLayoutEffect(() => {
    const c = caixa.current;
    if (!c) return;
    c.style.height = "auto";
    c.style.height = `${Math.min(c.scrollHeight, ALTURA_MAX)}px`;
  }, [texto]);

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
    // Altura da tela menos o cabeçalho (e, no celular, a barra de abas):
    // a conversa rola por dentro e a caixa de pergunta fica sempre embaixo.
    <div className="flex h-[calc(100dvh-8.5rem)] w-full gap-6 py-4 md:h-[calc(100dvh-3.5rem)]">
      {/* Lateral: conversas (computador) */}
      <aside aria-label="Conversas" className="hidden w-64 shrink-0 flex-col gap-3 md:flex">
        <Link href="/lessy?nova=1" className={botaoNova}>
          <Plus className="size-4" aria-hidden="true" />
          Nova conversa
        </Link>
        <p className="px-3 pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Conversas</p>
        <div className="rolagem-fina -mr-2 flex-1 overflow-y-auto pr-2">
          <ListaConversas historico={historico} atual={conversaId} />
        </div>
      </aside>

      {/* Conversa */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar />
            <div>
              <h1 className="font-display text-2xl leading-tight font-bold">Lessy</h1>
              <p className="text-sm text-muted-foreground">Pergunte sobre os impostos da sua empresa.</p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${esgotado ? "bg-imposto-soft" : "bg-primary-soft text-primary"}`}
          >
            {restantes} de {limite} {limite === 1 ? "pergunta" : "perguntas"} em {mes}
          </span>
        </div>

        {/* Celular: nova conversa e histórico recolhido */}
        <div className="flex items-start gap-2 md:hidden">
          <details className="min-w-0 flex-1 rounded-xl border border-border bg-card">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold">
              <History className="size-4 text-muted-foreground" aria-hidden="true" />
              Conversas
              {historico.length > 0 ? <span className="text-muted-foreground">({historico.length})</span> : null}
            </summary>
            <div className="rolagem-fina max-h-60 overflow-y-auto border-t border-border p-1">
              <ListaConversas historico={historico} atual={conversaId} />
            </div>
          </details>
          <Link href="/lessy?nova=1" aria-label="Nova conversa" className={`${botaoNova} shrink-0`}>
            <Plus className="size-4" aria-hidden="true" />
            Nova
          </Link>
        </div>

        <section
          ref={rolagem}
          aria-label="Conversa com o Lessy"
          className="rolagem-fina -mr-2 flex-1 overflow-y-auto overscroll-contain pr-2"
        >
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
            <ol className="flex flex-col gap-3 pb-2" aria-live="polite">
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
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 focus-within:border-primary"
        >
          {erro ? (
            <p role="alert" className="px-1 text-sm text-destructive">
              {erro}
            </p>
          ) : null}
          {esgotado && !erro ? (
            <p className="px-1 text-sm">
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
              ref={caixa}
              id="pergunta"
              rows={1}
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
              className="rolagem-fina min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
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
            Enter envia, Shift+Enter pula linha. O Lessy faz estimativas com os números que você lançou; para decisões,
            fale com seu contador.
            {texto.length > MAX - 100 ? ` ${texto.length}/${MAX}` : ""}
          </p>
        </form>
      </div>
    </div>
  );
}
