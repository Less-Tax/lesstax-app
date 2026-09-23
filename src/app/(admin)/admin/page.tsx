import Link from "next/link";
import { listarEmpresas, resumo, ultimosEventos } from "@/lib/admin/dados";
import { cnpj, dataHora } from "@/lib/admin/formato";

const ACOES: Record<string, string> = {
  empresa_verificada: "Empresa verificada",
  verificacao_desfeita: "Verificação desfeita",
};

function Numero({ rotulo, valor, nota, href }: { rotulo: string; valor: number; nota?: string; href?: string }) {
  const conteudo = (
    <>
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="font-display text-3xl font-bold tabular-nums">{valor.toLocaleString("pt-BR")}</p>
      {nota ? <p className="text-xs text-muted-foreground">{nota}</p> : null}
    </>
  );
  const classe = "flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-4";
  return href ? (
    <Link href={href} className={`${classe} hover:border-primary`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

export default async function Resumo() {
  const [n, pendentes, eventos] = await Promise.all([resumo(), listarEmpresas("pendentes"), ultimosEventos(10)]);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Resumo</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero rotulo="Usuários" valor={n.usuarios} nota={`${n.usuarios7} nos últimos 7 dias`} href="/admin/usuarios" />
        <Numero rotulo="Empresas" valor={n.empresas} nota={`${n.verificadas} verificadas`} href="/admin/empresas?filtro=todas" />
        <Numero rotulo="Aguardando verificação" valor={n.pendentes} href="/admin/empresas" />
        <Numero rotulo="Leads do MVP" valor={n.leads} nota={`${n.leads7} nos últimos 7 dias`} href="/admin/leads" />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">{n.meses.toLocaleString("pt-BR")} meses lançados no total.</p>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Fila de verificação</h2>
            <Link href="/admin/empresas" className="text-sm font-semibold text-primary">
              Ver todas
            </Link>
          </div>
          {pendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa esperando.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {pendentes.slice(0, 6).map((e) => (
                <li key={e.id} className="flex flex-col py-2 text-sm">
                  <span className="font-semibold">{e.nome}</span>
                  <span className="text-muted-foreground">
                    {cnpj(e.cnpj)} · {e.donos.map((d) => d.email).join(", ") || "sem dono"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Últimas ações</h2>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {eventos.map((e) => (
                <li key={e.id} className="flex flex-col py-2 text-sm">
                  <span>
                    <b>{ACOES[e.acao] ?? e.acao}</b>
                    {e.empresa ? ` — ${e.empresa}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {dataHora(e.criadoEm)}
                    {typeof e.detalhe?.por === "string" ? ` · ${e.detalhe.por}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
