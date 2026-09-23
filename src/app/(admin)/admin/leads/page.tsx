import { listarLeads } from "@/lib/admin/dados";
import { dataHora } from "@/lib/admin/formato";
import { reais } from "@/lib/formato";

export default async function Leads() {
  const leads = await listarLeads(200);

  return (
    <main className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Leads do MVP</h1>
        <p className="text-sm text-muted-foreground">Quem deixou o WhatsApp no site antigo. Os 200 mais recentes.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Quando</th>
              <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
              <th scope="col" className="px-4 py-3 font-semibold">WhatsApp</th>
              <th scope="col" className="px-4 py-3 font-semibold">Empresa</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Faturamento/mês</th>
              <th scope="col" className="px-4 py-3 font-semibold">Origem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((l) => {
              const digitos = l.whatsapp.replace(/\D/g, "");
              return (
                <tr key={l.id}>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{dataHora(l.criadoEm)}</td>
                  <td className="px-4 py-3 font-semibold">{l.nome}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`https://wa.me/55${digitos}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {l.whatsapp}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {l.empresa ?? "—"}
                    {l.atividade ? <span className="block text-xs text-muted-foreground">{l.atividade}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.faturamentoMes === null ? "—" : reais(l.faturamentoMes)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.origem ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leads.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Nenhum lead.</p> : null}
      </div>
    </main>
  );
}
