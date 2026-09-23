import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { AcaoVerificacao } from "@/components/admin/acao-verificacao";
import { Busca } from "@/components/admin/busca";
import { listarEmpresas, type FiltroEmpresas } from "@/lib/admin/dados";
import { cnpj, data } from "@/lib/admin/formato";
import { ATIVIDADES } from "@/lib/validacao/empresa";

const FILTROS: Record<FiltroEmpresas, string> = {
  pendentes: "Aguardando",
  verificadas: "Verificadas",
  todas: "Todas",
};

const METODO: Record<string, string> = { manual: "manual", cpf: "CPF", pix: "Pix" };

export default async function Empresas({ searchParams }: { searchParams: Promise<{ filtro?: string; q?: string }> }) {
  const p = await searchParams;
  const filtro: FiltroEmpresas = p.filtro && p.filtro in FILTROS ? (p.filtro as FiltroEmpresas) : "pendentes";
  const busca = (p.q ?? "").slice(0, 80);
  const empresas = await listarEmpresas(filtro, busca);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold">Empresas</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {(Object.keys(FILTROS) as FiltroEmpresas[]).map((f) => (
            <Link
              key={f}
              href={`/admin/empresas?filtro=${f}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`}
              aria-current={f === filtro ? "page" : undefined}
              className="rounded-full px-3 py-1 text-sm font-semibold text-muted-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
            >
              {FILTROS[f]}
            </Link>
          ))}
        </div>
        <Busca valor={busca} dica="Nome, CNPJ ou e-mail do dono" extras={{ filtro }} />
      </div>

      {filtro === "pendentes" ? (
        <p className="text-sm text-muted-foreground">
          Empresas com CNPJ que ainda não foram verificadas. Antes de verificar, confirme que quem está na conta
          responde pela empresa.
        </p>
      ) : null}

      {empresas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma empresa aqui.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {empresas.map((e) => (
            <li key={e.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-lg font-bold">
                    {e.nome}
                    {e.verificadaEm ? <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verificada" /> : null}
                  </p>
                  {e.razaoSocial ? <p className="truncate text-sm text-muted-foreground">{e.razaoSocial}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">desde {data(e.criadaEm)}</span>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">CNPJ</dt>
                <dd className="tabular-nums">
                  {cnpj(e.cnpj)}
                  {e.cnpjRemovidoEm && !e.cnpj ? (
                    <span className="ml-1 text-xs text-muted-foreground">(removido em {data(e.cnpjRemovidoEm)})</span>
                  ) : null}
                </dd>
                <dt className="text-muted-foreground">Atividade</dt>
                <dd>{ATIVIDADES[e.atividade as keyof typeof ATIVIDADES] ?? e.atividade}</dd>
                {e.municipio ? (
                  <>
                    <dt className="text-muted-foreground">Cidade</dt>
                    <dd>{[e.municipio, e.uf].filter(Boolean).join("/")}</dd>
                  </>
                ) : null}
                <dt className="text-muted-foreground">Dono</dt>
                <dd className="break-all">
                  {e.donos.length ? e.donos.map((d) => (d.nome ? `${d.nome} (${d.email})` : d.email)).join(", ") : "—"}
                </dd>
                <dt className="text-muted-foreground">Meses</dt>
                <dd>{e.meses}</dd>
                {e.verificadaEm ? (
                  <>
                    <dt className="text-muted-foreground">Verificada</dt>
                    <dd>
                      {data(e.verificadaEm)} por {e.verificadaPor} ({METODO[e.metodo ?? ""] ?? e.metodo})
                    </dd>
                  </>
                ) : null}
              </dl>

              {!e.verificadaEm && e.copias > 0 ? (
                <p className="rounded-lg bg-imposto-soft px-3 py-2 text-xs">
                  Mais {e.copias} {e.copias === 1 ? "conta usa" : "contas usam"} este CNPJ. Se esta for verificada, {e.copias === 1 ? "a outra perde" : "as outras perdem"} o CNPJ.
                </p>
              ) : null}

              {e.cnpj ? (
                <AcaoVerificacao key={e.verificadaEm ?? "nao"} empresaId={e.id} verificada={!!e.verificadaEm} />
              ) : (
                <p className="text-xs text-muted-foreground">Sem CNPJ: não há o que verificar.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
