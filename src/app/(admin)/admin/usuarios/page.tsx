import { AcaoPlano } from "@/components/admin/acao-plano";
import { Busca } from "@/components/admin/busca";
import { listarUsuarios } from "@/lib/admin/dados";
import { data, dataHora } from "@/lib/admin/formato";
import { mascaraTelefone } from "@/lib/validacao/perfil";

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const busca = ((await searchParams).q ?? "").slice(0, 80);
  const usuarios = await listarUsuarios(busca);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold">Usuários</h1>
      <Busca valor={busca} dica="Nome, e-mail ou empresa" />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Pessoa</th>
              <th scope="col" className="px-4 py-3 font-semibold">Empresa</th>
              <th scope="col" className="px-4 py-3 font-semibold">Celular</th>
              <th scope="col" className="px-4 py-3 font-semibold">Cadastro</th>
              <th scope="col" className="px-4 py-3 font-semibold">Último acesso</th>
              <th scope="col" className="px-4 py-3 font-semibold">Plano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{u.nome ?? "—"}</p>
                  <p className="text-muted-foreground">
                    {u.email}
                    {u.confirmado ? null : <span className="ml-1.5 rounded bg-imposto-soft px-1.5 text-xs text-foreground">e-mail não confirmado</span>}
                  </p>
                </td>
                <td className="px-4 py-3">{u.empresas.join(", ") || <span className="text-muted-foreground">sem empresa</span>}</td>
                <td className="px-4 py-3 tabular-nums">{u.telefone ? mascaraTelefone(u.telefone) : "—"}</td>
                <td className="px-4 py-3 tabular-nums">{data(u.criadoEm)}</td>
                <td className="px-4 py-3 tabular-nums">{dataHora(u.ultimoAcesso)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className={u.premium ? "font-semibold text-primary" : "text-muted-foreground"}>
                      {u.premium ? `Premium${u.premium.ate ? ` até ${data(u.premium.ate + "T12:00:00")}` : ""}` : "Gratuito"}
                    </span>
                    <AcaoPlano key={u.premium ? "p" : "g"} perfilId={u.id} premium={!!u.premium} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Ninguém encontrado.</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">{usuarios.length} {usuarios.length === 1 ? "usuário" : "usuários"}.</p>
    </main>
  );
}
