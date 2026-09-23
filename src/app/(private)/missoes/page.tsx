import { redirect } from "next/navigation";
import { Anel } from "@/components/missoes/anel";
import { ItemMissao } from "@/components/missoes/item";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { corDaSaude, nivel, pendentesPrimeiro, saude } from "@/lib/missoes/regras";
import { missoesDa } from "@/lib/missoes/servidor";

export const metadata = { title: "Missões — Less Tax" };

export default async function Missoes() {
  const [empresa] = await empresasDoUsuario();
  if (!empresa) redirect("/empresa/nova");

  const lista = await missoesDa(empresa);
  const pontos = saude(lista);
  const faltam = lista.filter((m) => !m.feita).length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Missões</h1>
        <p className="text-sm text-muted-foreground">Pequenas tarefas que deixam os impostos da empresa sob controle.</p>
      </div>

      <section className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5">
        <Anel pontos={pontos} />
        <div>
          <p className="text-sm text-muted-foreground">Saúde tributária</p>
          <p className="font-display text-2xl font-bold" style={{ color: corDaSaude(pontos) }}>
            {nivel(pontos)}
          </p>
          <p className="text-sm">
            {faltam === 0
              ? "Todas as missões feitas. Volte no mês que vem para lançar o próximo mês."
              : `Faltam ${faltam} ${faltam === 1 ? "missão" : "missões"} para ficar no controle.`}
          </p>
        </div>
      </section>

      <section aria-label="Lista de missões" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <ol className="flex flex-col divide-y divide-border">
          {pendentesPrimeiro(lista).map((m) => (
            <ItemMissao key={m.id} missao={m} />
          ))}
        </ol>
      </section>
    </main>
  );
}
