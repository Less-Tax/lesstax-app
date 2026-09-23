import { redirect } from "next/navigation";
import { sair } from "@/lib/auth/acoes";
import { usuarioAtual } from "@/lib/auth/usuario";
import { empresasDoUsuario } from "@/lib/db/empresas";
import { mascaraCnpj } from "@/lib/validacao/cnpj";

export const metadata = { title: "Início — Less Tax" };

/** Tela provisória: o Raio-X entra aqui na próxima etapa. */
export default async function Inicio() {
  const [usuario, empresas] = await Promise.all([usuarioAtual(), empresasDoUsuario()]);

  // Primeiro acesso: sem empresa, não há o que mostrar.
  if (empresas.length === 0) redirect("/empresa/nova");
  const empresa = empresas[0];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <p className="text-sm text-black/60 dark:text-white/60">{usuario?.email}</p>
        <h1 className="mt-1 text-2xl font-bold">{empresa.nome}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {[empresa.cnpj ? `CNPJ ${mascaraCnpj(empresa.cnpj)}` : null, empresa.municipio && empresa.uf ? `${empresa.municipio}/${empresa.uf}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {empresa.cnpj_removido_em && !empresa.cnpj ? (
        <div role="status" className="flex flex-col gap-1 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 p-3.5 text-sm">
          <p className="font-semibold">O CNPJ foi removido desta empresa</p>
          <p className="text-black/70 dark:text-white/70">
            Outra conta confirmou ser a dona desse CNPJ. Os números que você lançou continuam
            salvos. Se você faz parte da empresa, peça ao responsável para convidar você.
          </p>
        </div>
      ) : null}

      {empresa.verificada_em ? (
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          ✓ Empresa verificada
        </p>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl bg-black/[0.03] p-3.5 text-sm dark:bg-white/5">
          <p className="font-semibold">Empresa ainda não verificada</p>
          <p className="text-black/60 dark:text-white/60">
            Você já pode usar o Raio-X normalmente. A verificação confirma que esta conta é da
            empresa e libera convidar o contador e contratar a assessoria.
          </p>
        </div>
      )}

      <p className="text-sm text-black/60 dark:text-white/60">
        O Raio-X entra aqui na próxima etapa.
      </p>

      <form action={sair}>
        <button
          type="submit"
          className="rounded-xl border border-emerald-700 px-4 py-3 font-semibold text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
